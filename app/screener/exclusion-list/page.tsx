"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

interface ExclusionEntry {
  id: number;
  symbol: string;
  name: string;
  market: string;
  reason: string;
  source_file: string;
  created_at: string;
}

interface UploadPreview {
  filename: string;
  extracted_symbols: string[];
  extracted_count: number;
  preview: string[];
}

export default function ExclusionListPage() {
  const [exclusions, setExclusions] = useState<ExclusionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState("手動登録");
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadExclusions = useCallback(async () => {
    try {
      const data = await api.getExclusions();
      setExclusions(data.exclusions || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExclusions();
  }, [loadExclusions]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadExclusions(file);
      setPreview(data);
      setSelectedSymbols(new Set(data.extracted_symbols || []));
      showMessage("success", `${data.extracted_count}件の銘柄コードを抽出しました`);
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "ファイル解析エラー");
    } finally {
      setUploading(false);
    }
  };

  const handleBulkAdd = async () => {
    const items = Array.from(selectedSymbols).map((symbol) => ({
      symbol,
      name: "",
      market: "",
      reason: bulkReason,
      source_file: preview?.filename || "",
    }));
    try {
      const data = await api.addExclusionsBulk(items);
      showMessage("success", data.message);
      setPreview(null);
      setSelectedSymbols(new Set());
      loadExclusions();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "登録エラー");
    }
  };

  const handleManualAdd = async () => {
    if (!manualSymbol.trim()) return;
    try {
      const data = await api.addExclusion({
        symbol: manualSymbol.trim(),
        reason: manualReason || "手動登録",
      });
      showMessage("success", data.message);
      setManualSymbol("");
      setManualReason("");
      loadExclusions();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "登録エラー");
    }
  };

  const handleDelete = async (symbol: string) => {
    if (!confirm(`${symbol} を除外リストから削除しますか?`)) return;
    try {
      await api.deleteExclusion(symbol);
      showMessage("success", `${symbol} を削除しました`);
      loadExclusions();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "削除エラー");
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">除外リスト管理</h1>
        <p className="text-slate-400 text-sm mt-1">
          スクリーニングから除外する銘柄を管理します (現在 {total}件)
        </p>
      </div>

      {message && (
        <div className={`border rounded-lg p-3 text-sm ${
          message.type === "success"
            ? "bg-emerald-900/30 border-emerald-700 text-emerald-300"
            : "bg-red-900/30 border-red-700 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h2 className="text-sm font-bold text-white mb-3">ファイルアップロード</h2>
          <p className="text-xs text-slate-400 mb-3">
            CSV、Excel、テキストファイルをアップロードして銘柄コードを一括登録できます。
          </p>

          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="text-3xl">📄</span>
              <span className="text-sm text-slate-300">ファイルを選択</span>
              <span className="text-xs text-slate-500">CSV / Excel / テキスト / PDF対応</span>
            </label>
            {uploading && (
              <div className="mt-3 text-xs text-blue-400 animate-pulse">解析中...</div>
            )}
          </div>

          {preview && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-400">
                <strong className="text-slate-300">{preview.filename}</strong> から {preview.extracted_count}件を抽出
              </div>

              <div className="text-xs text-slate-400 mb-2">
                プレビュー (最初の20件):
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {preview.extracted_symbols.map((sym) => (
                  <label key={sym} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSymbols.has(sym)}
                      onChange={(e) => {
                        const next = new Set(selectedSymbols);
                        e.target.checked ? next.add(sym) : next.delete(sym);
                        setSelectedSymbols(next);
                      }}
                    />
                    <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{sym}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">除外理由</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                  placeholder="除外理由を入力"
                />
              </div>

              <button
                onClick={handleBulkAdd}
                disabled={selectedSymbols.size === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white py-2 rounded text-sm font-medium"
              >
                選択した {selectedSymbols.size}件 を除外リストに登録
              </button>

              <div className="text-xs text-amber-300 bg-amber-900/20 rounded p-2">
                ⚠ PDFからの自動抽出は誤認識がある場合があります。必ず上記で確認してから登録してください。
              </div>
            </div>
          )}
        </div>

        {/* Manual Add */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h2 className="text-sm font-bold text-white mb-3">手動登録</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">銘柄コード</label>
              <input
                type="text"
                value={manualSymbol}
                onChange={(e) => setManualSymbol(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                placeholder="例: 7203.T または AAPL"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">除外理由</label>
              <input
                type="text"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                placeholder="例: 天井大商い済み"
              />
            </div>
            <button
              onClick={handleManualAdd}
              disabled={!manualSymbol.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white py-2 rounded text-sm font-medium"
            >
              除外リストに登録
            </button>
          </div>

          {/* Export */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <a
              href={api.exportCSV({ classification: "除外" })}
              className="block text-center bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded text-sm"
            >
              除外リストCSV出力
            </a>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white">登録済み除外リスト ({total}件)</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">読み込み中...</div>
        ) : exclusions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">除外リストは空です</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  {["銘柄コード", "銘柄名", "市場", "除外理由", "登録元ファイル", "登録日時", "操作"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exclusions.map((e) => (
                  <tr key={e.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white font-mono">{e.symbol}</td>
                    <td className="px-3 py-2 text-slate-300">{e.name || "-"}</td>
                    <td className="px-3 py-2 text-slate-400">{e.market || "-"}</td>
                    <td className="px-3 py-2 text-orange-400">{e.reason}</td>
                    <td className="px-3 py-2 text-slate-400">{e.source_file || "-"}</td>
                    <td className="px-3 py-2 text-slate-500">{e.created_at?.slice(0, 10) || "-"}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(e.symbol)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
