'use client';

import { ChangeEvent, useMemo, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Link2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { bulkImportStudentsAction } from '@/lib/actions';
import { normalizeImportRows, normalizeSheetUrl, RawImportRow } from '@/lib/sheet';
import { queryKeys } from '@/lib/query-keys';
import { toISODate } from '@/lib/utils';
import { ImportReport, StudentClass } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EditableImportRow {
  rowNumber: number;
  name: string;
  class: StudentClass | '';
  parent_name?: string;
  phone: string;
  enrollment_date: string;
  errors: string[];
}

function validateEditableRow(row: EditableImportRow) {
  const errors: string[] = [];
  if (!row.name.trim()) errors.push('Name required');
  if (row.class !== '9' && row.class !== '10') errors.push('Class must be 9/10');
  if (row.enrollment_date) {
    const d = new Date(row.enrollment_date);
    if (Number.isNaN(d.getTime())) errors.push('Invalid date');
  }
  return errors;
}

async function parseCsvText(text: string): Promise<RawImportRow[]> {
  const papaModule = await import('papaparse');
  const Papa = papaModule.default;

  return new Promise((resolve, reject) => {
    Papa.parse<RawImportRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        resolve(results.data || []);
      },
      error(error: Error) {
        reject(error);
      }
    });
  });
}

async function fetchRowsFromUrl(url: string) {
  const response = await fetch('/api/sheet-fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: normalizeSheetUrl(url) })
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to fetch sheet URL');
  }

  const payload = await response.json();
  return parseCsvText(payload.csvText as string);
}

async function parseUploadedFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return parseCsvText(text);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx');

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    return XLSX.utils.sheet_to_json<RawImportRow>(worksheet, { defval: '' });
  }

  throw new Error('Unsupported file. Upload CSV or XLSX.');
}

export function StudentImportDialog({ onImported }: { onImported?: () => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [sheetUrl, setSheetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<EditableImportRow[]>([]);
  const [report, setReport] = useState<ImportReport | null>(null);

  const [isParsing, startParsing] = useTransition();
  const [isImporting, startImporting] = useTransition();

  const invalidCount = useMemo(() => rows.filter((row) => validateEditableRow(row).length > 0).length, [rows]);

  const updateRow = <K extends keyof EditableImportRow>(
    rowNumber: number,
    key: K,
    value: EditableImportRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        const updated = { ...row, [key]: value };
        return { ...updated, errors: validateEditableRow(updated) };
      })
    );
  };

  const removeRow = (rowNumber: number) => {
    setRows((prev) => prev.filter((row) => row.rowNumber !== rowNumber));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowNumber: (prev[prev.length - 1]?.rowNumber || 0) + 1,
        name: '',
        class: '',
        phone: '',
        enrollment_date: toISODate(),
        errors: ['Name required', 'Class must be 9/10']
      }
    ]);
  };

  const parseSource = () => {
    startParsing(async () => {
      try {
        if (mode === 'url' && !sheetUrl.trim()) {
          toast.error('Please enter a sheet URL');
          return;
        }

        if (mode === 'file' && !file) {
          toast.error('Please upload a file first');
          return;
        }

        const rawRows = mode === 'url' ? await fetchRowsFromUrl(sheetUrl) : await parseUploadedFile(file as File);

        if (!rawRows.length) {
          toast.error('No rows found in the sheet');
          return;
        }

        const normalized = normalizeImportRows(rawRows).map((row) => ({
          ...row,
          errors: validateEditableRow(row)
        }));

        setRows(normalized);
        setReport(null);
        toast.success(`Loaded ${normalized.length} row(s) into preview`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to parse sheet');
      }
    });
  };

  const importRows = () => {
    if (!rows.length) {
      toast.error('No rows in preview to import');
      return;
    }

    startImporting(async () => {
      const payload = rows.map((row) => ({
        rowNumber: row.rowNumber,
        name: row.name,
        class: row.class,
        parent_name: row.parent_name,
        phone: row.phone,
        enrollment_date: row.enrollment_date
      }));

      const result = await bulkImportStudentsAction(payload);

      if (!result.success) {
        toast.error(result.error || 'Import failed');
        if (result.data) setReport(result.data);
        return;
      }

      setReport(result.data || null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.students }),
        queryClient.invalidateQueries({ queryKey: queryKeys.studentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      ]);

      toast.success(result.message || 'Import completed');
      onImported?.();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSheetUrl('');
          setFile(null);
          setRows([]);
          setReport(null);
          setMode('url');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Import Students
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Import via Google Sheet URL or upload CSV/XLSX. Review and fix rows before final import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as 'url' | 'file')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Google Sheet URL</SelectItem>
                  <SelectItem value="file">Upload CSV/XLSX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'url' ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Sheet URL</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Paste Google Sheet link"
                    value={sheetUrl}
                    onChange={(event) => setSheetUrl(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={parseSource}
                    disabled={isParsing || !sheetUrl.trim()}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    {isParsing ? 'Loading...' : 'Load'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Only allowlisted hosts can be fetched for security.</p>
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Upload file</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setFile(event.target.files?.[0] || null);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={parseSource}
                    disabled={isParsing || !file}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {isParsing ? 'Loading...' : 'Load'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Rows: {rows.length}</Badge>
                  <Badge variant={invalidCount ? 'destructive' : 'secondary'}>Invalid: {invalidCount}</Badge>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>

              <div className="space-y-3 md:hidden">
                {rows.map((row) => (
                  <div key={row.rowNumber} className="space-y-3 rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Row {row.rowNumber}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRow(row.rowNumber)}
                        className="h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove row {row.rowNumber}</span>
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      <Input
                        placeholder="Student name"
                        value={row.name}
                        onChange={(event) => updateRow(row.rowNumber, 'name', event.target.value)}
                      />

                      <Select
                        value={row.class || 'empty'}
                        onValueChange={(value) =>
                          updateRow(row.rowNumber, 'class', value === 'empty' ? '' : (value as StudentClass))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empty">Select class</SelectItem>
                          <SelectItem value="9">Class 9</SelectItem>
                          <SelectItem value="10">Class 10</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Phone"
                        value={row.phone}
                        onChange={(event) => updateRow(row.rowNumber, 'phone', event.target.value)}
                      />

                      <Input
                        type="date"
                        value={row.enrollment_date}
                        onChange={(event) => updateRow(row.rowNumber, 'enrollment_date', event.target.value)}
                      />
                    </div>

                    {row.errors.length ? (
                      <Badge variant="destructive" className="max-w-full whitespace-normal leading-4">
                        {row.errors.join(', ')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Ready</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden rounded-md border border-border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(event) => updateRow(row.rowNumber, 'name', event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.class || 'empty'}
                            onValueChange={(value) =>
                              updateRow(row.rowNumber, 'class', value === 'empty' ? '' : (value as StudentClass))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="empty">Select</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.phone}
                            onChange={(event) => updateRow(row.rowNumber, 'phone', event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.enrollment_date}
                            onChange={(event) => updateRow(row.rowNumber, 'enrollment_date', event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {row.errors.length ? (
                            <Badge variant="destructive" className="max-w-[220px] whitespace-normal leading-4">
                              {row.errors.join(', ')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Ready</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRow(row.rowNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {report ? (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
              <p className="font-medium">Import Report</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">Inserted: {report.inserted}</Badge>
                <Badge variant="outline">Skipped duplicates: {report.skippedDuplicates}</Badge>
                <Badge variant={report.failed > 0 ? 'destructive' : 'outline'}>Failed: {report.failed}</Badge>
              </div>

              {report.skippedRows.length ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Skipped rows</p>
                  {report.skippedRows.slice(0, 10).map((item) => (
                    <p key={`${item.rowNumber}-${item.reason}`}>
                      Row {item.rowNumber}: {item.reason}
                    </p>
                  ))}
                </div>
              ) : null}

              {report.failedRows.length ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Failed rows</p>
                  {report.failedRows.slice(0, 10).map((item) => (
                    <p key={`${item.rowNumber}-${item.reason}`}>
                      Row {item.rowNumber}: {item.reason}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={importRows} disabled={isImporting || !rows.length || invalidCount > 0}>
            {isImporting ? 'Importing...' : 'Import Valid Rows'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
