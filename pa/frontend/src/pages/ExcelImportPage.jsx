import { useState, useRef } from 'react'
import { excelApi } from '../services/api'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const DEFAULT_COLS = { team_col: 'team_name', client_col: 'client_name', user_col: 'user_name', production_col: 'production_value', target_col: 'target_value', date_col: 'date' }

export default function ExcelImportPage() {
  const [file, setFile] = useState(null)
  const [cols, setCols] = useState(DEFAULT_COLS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['.xlsx', '.xls', '.csv']
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) return toast.error('Only Excel (.xlsx, .xls) and CSV files allowed')
    setFile(f); setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!file) return toast.error('Please select a file')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(cols).forEach(([k, v]) => fd.append(k, v))
      const res = await excelApi.import(fd)
      setResult(res.data)
      toast.success(res.data.message)
    } catch (err) { toast.error(err.response?.data?.detail || 'Import failed') }
    finally { setLoading(false) }
  }

  const downloadTemplate = () => {
    const csv = 'team_name,client_name,user_name,production_value,target_value,date\nTeam Alpha,Client A,John Doe,850,1000,2024-01-15'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'production_template.csv'; a.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Excel Import</h1>
          <p className="text-sm text-[var(--text-muted)]">Bulk import production data from spreadsheets</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary text-sm"><Download className="w-4 h-4" />Download Template</button>
      </div>

      {/* Info */}
      <div className="card bg-blue-500/5 border-blue-500/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text)] mb-1">Supported formats: .xlsx, .xls, .csv</p>
            <p>Required columns: team_name, user_name, production_value, date. Optional: client_name, target_value.</p>
            <p className="mt-1">Column names are matched case-insensitively. Spaces are converted to underscores.</p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`card border-2 border-dashed cursor-pointer transition-all ${dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-[var(--border)] hover:border-brand-500/50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-center py-8">
          <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-brand-500' : 'text-[var(--text-muted)]'}`} />
          {file ? (
            <div>
              <p className="font-medium text-[var(--text)]">{file.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-[var(--text)]">Drag & drop or click to select file</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">.xlsx, .xls, .csv supported</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Column Mapping */}
      <div className="card">
        <h3 className="font-semibold text-[var(--text)] mb-4">Column Mapping</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(cols).map(([key, val]) => (
            <div key={key}>
              <label className="label">{key.replace(/_col$/, '').replace(/_/g, ' ').toUpperCase()} column name</label>
              <input className="input" value={val} onChange={e => setCols(c => ({ ...c, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => setCols(DEFAULT_COLS)} className="btn-secondary text-xs mt-3">Reset to Defaults</button>
      </div>

      <button onClick={handleImport} className="btn-primary py-2.5 px-6" disabled={!file || loading}>
        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Upload className="w-4 h-4" />}
        {loading ? 'Importing...' : 'Import Data'}
      </button>

      {/* Result */}
      {result && (
        <div className="card animate-fadeIn">
          <h3 className="font-semibold text-[var(--text)] mb-4">Import Result</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-[var(--bg)] rounded-lg">
              <div className="text-2xl font-bold font-display text-[var(--text)]">{result.total_rows}</div>
              <div className="text-xs text-[var(--text-muted)]">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="text-2xl font-bold font-display text-green-500">{result.inserted}</div>
              <div className="text-xs text-[var(--text-muted)]">Imported</div>
            </div>
            <div className="text-center p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="text-2xl font-bold font-display text-red-500">{result.errors?.length || 0}</div>
              <div className="text-xs text-[var(--text-muted)]">Errors</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-500">Errors:</p>
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                  <span className="badge-red">Row {e.row}</span>
                  <span>{e.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
