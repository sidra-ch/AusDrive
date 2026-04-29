"use client";

import { useState } from "react";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";

type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export function CSVImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const cars = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const car: Record<string, string> = {};
        headers.forEach((header, i) => {
          car[header] = values[i] || "";
        });
        return car;
      });

      const response = await fetch("/api/cars/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cars }),
      });

      const data = await response.json();
      setResult(data.results);
    } catch (error) {
      console.error("Import error:", error);
      setResult({ success: 0, failed: 0, errors: ["Failed to parse CSV file"] });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `make,model,year,plate,category,daily_rate,weekend_rate,status,branch,city,area,colour,transmission,fuel_type,seats,bags,late_fee,deposit
Toyota,Camry,2023,ABC-123,Economy,50,60,available,Sydney,Sydney,Bondi,White,Automatic,Petrol,5,2,25,500
BMW,X5,2024,XYZ-789,Luxury,150,180,available,Melbourne,Melbourne,CBD,Black,Automatic,Diesel,7,4,30,1000`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "car-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-input bg-background p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Bulk Import Cars</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload CSV file to add multiple cars</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={importing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-cyan-500/40 transition">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-medium">
            {importing ? "Importing..." : "Click to upload CSV file"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
        </div>
      </div>

      {result && (
        <div className="mt-4 space-y-2">
          {result.success > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400">
                Successfully imported {result.success} cars
              </span>
            </div>
          )}
          {result.failed > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-400">
                  {result.failed} cars failed to import
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="ml-7 space-y-1">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <p key={i} className="text-xs text-red-300/80">{error}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-red-300/60">
                      ...and {result.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
