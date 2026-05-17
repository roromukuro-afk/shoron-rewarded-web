"use client";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Settings {
  price_limit_jpy: number;
  min_volume_jp: number;
  min_volume_us: number;
  min_turnover_jp_yen: number;
  min_turnover_us_usd: number;
  min_score: number;
  include_adr: boolean;
  default_market: string;
  default_mode: string;
  apply_exclusion_list: boolean;
  default_usdjpy: number;
}

const DEFAULT_SETTINGS: Settings = {
  price_limit_jpy: 3000,
  min_volume_jp: 30000,
  min_volume_us: 100000,
  min_turnover_jp_yen: 30000000,
  min_turnover_us_usd: 300000,
  min_score: 65,
  include_adr: false,
  default_market: "JP",
  default_mode: "sample",
  apply_exclusion_list: true,
  default_usdjpy: 155.0,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存エラー");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setSettings(DEFAULT_SETTINGS);

  if (loading) return <div className="text-center py-20 text-slate-400">読み込み中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-slate-400 text-sm mt-1">スクリーニングのデフォルト設定を変更します</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}
      {saved && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 text-emerald-300 text-sm">
          設定を保存しました
        </div>
      )}

      {/* Price / Liquidity */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">価格・流動性フィルター</h2>

        <SettingRow label="価格上限 (円)" hint="この価格以下の銘柄を対象にします">
          <input
            type="number"
            value={settings.price_limit_jpy}
            onChange={(e) => setSettings({ ...settings, price_limit_jpy: Number(e.target.value) })}
            className="input-field w-32"
          />
        </SettingRow>

        <SettingRow label="日本株 最小出来高 (株/日)" hint="20日平均出来高の下限">
          <input
            type="number"
            value={settings.min_volume_jp}
            onChange={(e) => setSettings({ ...settings, min_volume_jp: Number(e.target.value) })}
            className="input-field w-40"
          />
        </SettingRow>

        <SettingRow label="米国株 最小出来高 (株/日)" hint="20日平均出来高の下限">
          <input
            type="number"
            value={settings.min_volume_us}
            onChange={(e) => setSettings({ ...settings, min_volume_us: Number(e.target.value) })}
            className="input-field w-40"
          />
        </SettingRow>

        <SettingRow label="日本株 最小売買代金 (円/日)" hint="1億円以上推奨">
          <input
            type="number"
            value={settings.min_turnover_jp_yen}
            onChange={(e) => setSettings({ ...settings, min_turnover_jp_yen: Number(e.target.value) })}
            className="input-field w-48"
          />
        </SettingRow>

        <SettingRow label="米国株 最小売買代金 (USD/日)" hint="300,000 USD以上推奨">
          <input
            type="number"
            value={settings.min_turnover_us_usd}
            onChange={(e) => setSettings({ ...settings, min_turnover_us_usd: Number(e.target.value) })}
            className="input-field w-48"
          />
        </SettingRow>
      </div>

      {/* Score Threshold */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">スコア閾値</h2>

        <SettingRow label="表示最低スコア" hint="このスコア以上の銘柄のみ結果に表示 (監視候補下限)">
          <input
            type="number"
            min={0}
            max={100}
            value={settings.min_score}
            onChange={(e) => setSettings({ ...settings, min_score: Number(e.target.value) })}
            className="input-field w-24"
          />
          <span className="text-slate-400 text-xs">点以上</span>
        </SettingRow>

        <div className="bg-slate-900 rounded p-3 text-xs text-slate-400 space-y-1">
          <div>採用候補: <span className="text-emerald-400">85点以上</span></div>
          <div>条件付き候補: <span className="text-blue-400">75〜84点</span></div>
          <div>監視候補: <span className="text-yellow-400">65〜74点</span> (最低スコアで変更可能)</div>
        </div>
      </div>

      {/* FX */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">為替レート</h2>
        <SettingRow label="USD/JPY デフォルトレート" hint="サンプルモード時・取得失敗時のフォールバック">
          <input
            type="number"
            step="0.1"
            value={settings.default_usdjpy}
            onChange={(e) => setSettings({ ...settings, default_usdjpy: Number(e.target.value) })}
            className="input-field w-28"
          />
          <span className="text-slate-400 text-xs">円/USD</span>
        </SettingRow>
      </div>

      {/* Defaults */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">デフォルト設定</h2>

        <SettingRow label="デフォルト対象市場" hint="スクリーニングページの初期選択">
          <select
            value={settings.default_market}
            onChange={(e) => setSettings({ ...settings, default_market: e.target.value })}
            className="input-field"
          >
            <option value="ALL">全市場</option>
            <option value="JP">日本株</option>
            <option value="US">米国株</option>
          </select>
        </SettingRow>

        <SettingRow label="デフォルトモード" hint="スクリーニングの初期モード">
          <select
            value={settings.default_mode}
            onChange={(e) => setSettings({ ...settings, default_mode: e.target.value })}
            className="input-field"
          >
            <option value="sample">サンプルモード (高速・通信不要)</option>
            <option value="real">実データモード (yfinance)</option>
          </select>
        </SettingRow>

        <SettingRow label="ADRをデフォルト含む" hint="ADR（米国預託証券）を対象に含めるか">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.include_adr}
              onChange={(e) => setSettings({ ...settings, include_adr: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-slate-300 text-sm">含める</span>
          </label>
        </SettingRow>

        <SettingRow label="除外リストを適用" hint="スクリーニング時に除外リストを参照する">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.apply_exclusion_list}
              onChange={(e) => setSettings({ ...settings, apply_exclusion_list: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-slate-300 text-sm">適用する</span>
          </label>
        </SettingRow>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
        <button
          onClick={handleReset}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
        >
          デフォルトに戻す
        </button>
      </div>

      <div className="text-xs text-slate-500 bg-slate-900 border border-slate-700 rounded p-3">
        設定はデータベースに保存されます。スクリーニング実行時に反映されます。
      </div>

      <style>{`.input-field { background: #334155; border: 1px solid #475569; border-radius: 6px; padding: 6px 12px; color: white; font-size: 14px; outline: none; }
.input-field:focus { border-color: #3b82f6; }`}</style>
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="sm:w-56 flex-shrink-0">
        <div className="text-sm text-white">{label}</div>
        <div className="text-xs text-slate-500">{hint}</div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
