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
  if (!row.class || (row.class !== '9' && row.class !== '10')) {
    errors.push('Class must be 9/10');
  }
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
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results.data || []);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

async function fetchRowsFromUrl(url: string) {
  const normalizedUrl = normalizeSheetUrl(url);

  const response = await fetch('/api/sheet-fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sheetUrl: normalizedUrl })
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to fetch sheet URL');
  }

  const payload = await response.json();
  return parseCsvText(payload.csvText as string);
}

async function parseUploadedFile(file: File): Promise<RawImportRow[]> {
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

    // Read as 2D array first to check if first row contains column headers or data
    const rawArrays = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
    if (!rawArrays.length) return [];

    const nonEmptyRows = rawArrays.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ''));
    if (!nonEmptyRows.length) return [];

    const firstRow = nonEmptyRows[0];
    const firstRowStr = firstRow.map((c) => String(c).toLowerCase().trim());

    // Check if the first row looks like headers (contains words like name, student, phone, mobile, etc.)
    const isHeaderRow = firstRowStr.some((col) =>
      ['name', 'student', 'phone', 'number', 'mobile', 'contact', 'class', 'grade', 'std'].some((h) =>
        col.includes(h)
      )
    );

    if (isHeaderRow) {
      return XLSX.utils.sheet_to_json<RawImportRow>(worksheet, { defval: '' });
    } else {
      // Headerless file: row 0 is already student data (e.g. col 0 is Name, col 1 is Phone)
      return nonEmptyRows.map((rowArr) => {
        const obj: RawImportRow = {};
        rowArr.forEach((val, idx) => {
          if (idx === 0) obj['name'] = val;
          else if (idx === 1) obj['phone'] = val;
          else obj[`col_${idx}`] = val;
        });
        return obj;
      });
    }
  }

  throw new Error('Unsupported file. Upload CSV or XLSX.');
}

export function StudentImportDialog({ onImported }: { onImported?: () => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'url' | 'file'>('file');
  const [sheetUrl, setSheetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [defaultClass, setDefaultClass] = useState<StudentClass>('10');
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
        class: defaultClass,
        phone: '',
        enrollment_date: toISODate(),
        errors: ['Name required']
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

        const normalized = normalizeImportRows(rawRows, defaultClass).map((row) => ({
          ...row,
          errors: validateEditableRow(row)
        }));

        setRows(normalized);
        setReport(null);
        toast.success(`Loaded ${normalized.length} student row(s) into preview`);
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
        class: row.class || defaultClass,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot })
      ]);

      toast.success(
        `Import complete: ${result.data?.inserted || 0} added, ${result.data?.skippedDuplicates || 0} duplicates skipped.`
      );

      if (onImported) onImported();
      if (!result.data?.failed && !result.data?.skippedRows.length) {
        setRows([]);
        setFile(null);
        setSheetUrl('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload your CSV/XLSX file with student names and phone numbers. If your file does not contain a class column, they will automatically be assigned to the selected default class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 rounded-xl border border-border/70 bg-card/40 p-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as 'url' | 'file')}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Upload CSV / XLSX</SelectItem>
                  <SelectItem value="url">Google Sheet URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Class</Label>
              <Select
                value={defaultClass}
                onValueChange={(value) => {
                  const nextCls = value as StudentClass;
                  setDefaultClass(nextCls);
                  setRows((prev) =>
                    prev.map((r) => {
                      const updated = { ...r, class: nextCls };
                      return { ...updated, errors: validateEditableRow(updated) };
                    })
                  );
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Default Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Class 10 (Default)</SelectItem>
                  <SelectItem value="9">Class 9</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'url' ? (
              <div className="space-y-2">
                <Label>Sheet URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste Google Sheet link"
                    value={sheetUrl}
                    onChange={(event) => setSheetUrl(event.target.value)}
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={parseSource}
                    disabled={isParsing || !sheetUrl.trim()}
                    className="h-10 gap-2 shrink-0"
                  >
                    <Link2 className="h-4 w-4" />
                    {isParsing ? 'Loading...' : 'Load'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Upload file (.xlsx / .csv)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setFile(event.target.files?.[0] || null);
                    }}
                    className="h-10 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={parseSource}
                    disabled={isParsing || !file}
                    className="h-10 gap-2 shrink-0"
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
                  <Badge variant={invalidCount ? 'destructive' : 'secondary'}>
                    {invalidCount ? `Invalid: ${invalidCount}` : 'All Valid'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Assigned to Class {defaultClass}
                  </span>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>

              <div className="max-h-72 overflow-auto rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[180px]">Name *</TableHead>
                      <TableHead className="w-28">Class *</TableHead>
                      <TableHead className="min-w-[150px]">Phone</TableHead>
                      <TableHead className="min-w-[150px]">Enrollment Date</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="w-16 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          <Input
                            value={row.name ?? ''}
                            onChange={(event) => updateRow(row.rowNumber, 'name', event.target.value)}
                            placeholder="Student name"
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.class || defaultClass}
                            onValueChange={(value) => updateRow(row.rowNumber, 'class', value as StudentClass)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">Class 10</SelectItem>
                              <SelectItem value="9">Class 9</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.phone ?? ''}
                            onChange={(event) => updateRow(row.rowNumber, 'phone', event.target.value)}
                            placeholder="Phone number"
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.enrollment_date ?? ''}
                            onChange={(event) => updateRow(row.rowNumber, 'enrollment_date', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          {row.errors.length ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {row.errors.join(', ')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRow(row.rowNumber)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-sm">Import Report</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">Inserted: {report.inserted}</Badge>
                <Badge variant="outline">Skipped duplicates: {report.skippedDuplicates}</Badge>
                <Badge variant={report.failed > 0 ? 'destructive' : 'outline'}>
                  Failed: {report.failed}
                </Badge>
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={importRows} disabled={isImporting || !rows.length || invalidCount > 0}>
            {isImporting ? 'Importing...' : `Import ${rows.length} Student${rows.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
