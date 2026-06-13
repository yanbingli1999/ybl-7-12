import { useState } from 'react';
import { X, Plus, Trash2, Save, Clock, DollarSign, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import type { Template, TemplateCategory, TemplateVariable, VariableType } from '../../shared/types.js';

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: 'engineering', label: '工程建设' },
  { value: 'software', label: '软件开发' },
  { value: 'finance', label: '金融投资' },
  { value: 'manufacturing', label: '制造生产' },
  { value: 'marketing', label: '市场营销' },
  { value: 'other', label: '其他' },
];

const VARIABLE_TYPE_OPTIONS: { value: VariableType; label: string; defaultWeight: number; defaultUnit: string }[] = [
  { value: 'cost', label: '成本 (权重 -1)', defaultWeight: -1, defaultUnit: '万元' },
  { value: 'duration', label: '工期 (权重 -1)', defaultWeight: -1, defaultUnit: '天' },
  { value: 'revenue', label: '收益 (权重 +1)', defaultWeight: 1, defaultUnit: '万元' },
  { value: 'custom', label: '自定义', defaultWeight: 1, defaultUnit: '' },
];

interface TemplateModalProps {
  template?: Template;
  onSave: (template: Template) => Promise<void>;
  onClose: () => void;
}

const emptyVar: Omit<TemplateVariable, never> = {
  name: '', type: 'custom', min: 0, max: 0, mostLikely: 0, weight: 1, unit: '',
};

interface VariableValidationError {
  name?: string;
  params?: string;
}

function validateVariable(v: TemplateVariable, index: number): VariableValidationError | null {
  const errors: VariableValidationError = {};
  const row = `第 ${index + 1} 行`;

  if (!v.name || !v.name.trim()) {
    errors.name = `${row}：请填写变量名称`;
  }

  const min = Number(v.min);
  const max = Number(v.max);
  const mostLikely = Number(v.mostLikely);
  const weight = Number(v.weight);

  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(mostLikely)) {
    errors.params = `${row}：三点估算值必须为有效数字`;
  } else if (Number.isNaN(weight)) {
    errors.params = `${row}：权重必须为有效数字`;
  } else if (!(min < mostLikely && mostLikely < max)) {
    if (min >= max) {
      errors.params = `${row}：最小值必须小于最大值`;
    } else if (mostLikely <= min) {
      errors.params = `${row}：最可能值必须大于最小值`;
    } else if (mostLikely >= max) {
      errors.params = `${row}：最可能值必须小于最大值`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export default function TemplateModal({ template, onSave, onClose }: TemplateModalProps) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'other');
  const [description, setDescription] = useState(template?.description || '');
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template?.variables?.length ? template.variables : [{ ...emptyVar }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<number, VariableValidationError | null>>({});

  const addVariable = () => {
    setVariables([...variables, { ...emptyVar }]);
  };

  const removeVariable = (index: number) => {
    if (variables.length <= 1) return;
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    const updated = [...variables];
    const v = { ...updated[index], [field]: value };
    if (field === 'type') {
      const cfg = VARIABLE_TYPE_OPTIONS.find(o => o.value === value);
      if (cfg) {
        v.weight = cfg.defaultWeight;
        if (!updated[index].unit) v.unit = cfg.defaultUnit;
      }
    }
    updated[index] = v;
    setVariables(updated);
  };

  const validateRow = (index: number) => {
    const err = validateVariable(variables[index], index);
    setErrors(prev => ({ ...prev, [index]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const newErrors: Record<number, VariableValidationError | null> = {};
    let hasErrors = false;

    variables.forEach((v, i) => {
      const err = validateVariable(v, i);
      newErrors[i] = err;
      if (err) hasErrors = true;
    });

    setErrors(newErrors);

    if (!name.trim()) {
      setSaveError('请填写模板名称');
      return;
    }

    if (hasErrors) {
      const allErrors: string[] = [];
      Object.values(newErrors).forEach(err => {
        if (err) {
          if (err.name) allErrors.push(err.name);
          if (err.params) allErrors.push(err.params);
        }
      });
      setSaveError(allErrors.slice(0, 5).join('；') + (allErrors.length > 5 ? `；…还有 ${allErrors.length - 5} 项` : ''));
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const result: Template = {
        id: template?.id || '',
        name: name.trim(),
        category,
        description: description.trim(),
        variables,
        createdAt: template?.createdAt || now,
        updatedAt: now,
      };
      await onSave(result);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-monte-muted hover:text-white hover:bg-monte-border transition-all">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Save className="w-5 h-5 text-monte-accent" />
          {isEdit ? '编辑模板' : '新建模板'}
        </h2>
        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-monte-danger/10 border border-monte-danger/40 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-monte-danger mt-0.5 flex-shrink-0" />
            <p className="text-sm text-monte-danger">{saveError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">模板名称 *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：建筑工程标准变量组"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label">业务分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TemplateCategory)}
                className="input"
              >
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">适用说明</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述模板适用的场景和注意事项..."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">变量列表 *</label>
              <button type="button" onClick={addVariable} className="btn-secondary text-xs !py-1 !px-2.5">
                <Plus className="w-3.5 h-3.5" />
                添加变量
              </button>
            </div>

            {variables.map((v, i) => {
              const rowErrors = errors[i];
              const hasRowError = !!rowErrors;
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border space-y-3 transition-colors ${
                    hasRowError
                      ? 'bg-monte-danger/5 border-monte-danger/50'
                      : 'bg-monte-bg/50 border-monte-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono w-6 ${hasRowError ? 'text-monte-danger' : 'text-monte-muted'}`}>
                      #{i + 1}
                    </span>
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => updateVariable(i, 'name', e.target.value)}
                      onBlur={() => validateRow(i)}
                      placeholder="变量名称"
                      className={`input !py-1.5 flex-1 ${
                        rowErrors?.name ? '!border-monte-danger !ring-1 !ring-monte-danger/40' : ''
                      }`}
                    />
                    <select
                      value={v.type}
                      onChange={e => updateVariable(i, 'type', e.target.value as VariableType)}
                      className="input !py-1.5 w-36"
                    >
                      {VARIABLE_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={v.unit}
                      onChange={e => updateVariable(i, 'unit', e.target.value)}
                      placeholder="单位"
                      className="input !py-1.5 w-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariable(i)}
                      disabled={variables.length <= 1}
                      className="p-1.5 rounded-md text-monte-muted hover:text-monte-danger hover:bg-monte-danger/15 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pl-6">
                    <div className="flex-1">
                      <label className={`text-[10px] font-medium uppercase tracking-wider ${rowErrors?.params ? 'text-monte-danger' : 'text-monte-danger'}`}>最小值</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.min}
                        onChange={e => updateVariable(i, 'min', Number(e.target.value) || 0)}
                        onBlur={() => validateRow(i)}
                        className={`input !py-1 font-mono ${rowErrors?.params ? '!border-monte-danger/60' : '!border-monte-danger/40'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={`text-[10px] font-medium uppercase tracking-wider ${rowErrors?.params ? 'text-monte-danger' : 'text-monte-accent'}`}>最可能值</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.mostLikely}
                        onChange={e => updateVariable(i, 'mostLikely', Number(e.target.value) || 0)}
                        onBlur={() => validateRow(i)}
                        className={`input !py-1 font-mono ${rowErrors?.params ? '!border-monte-danger/60' : '!border-monte-accent/50'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={`text-[10px] font-medium uppercase tracking-wider ${rowErrors?.params ? 'text-monte-danger' : 'text-monte-safe'}`}>最大值</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.max}
                        onChange={e => updateVariable(i, 'max', Number(e.target.value) || 0)}
                        onBlur={() => validateRow(i)}
                        className={`input !py-1 font-mono ${rowErrors?.params ? '!border-monte-danger/60' : '!border-monte-safe/40'}`}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-monte-muted font-medium uppercase tracking-wider">权重</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.weight}
                        onChange={e => updateVariable(i, 'weight', Number(e.target.value) || 0)}
                        onBlur={() => validateRow(i)}
                        className="input !py-1 font-mono"
                      />
                    </div>
                  </div>
                  {rowErrors && (
                    <div className="pl-6 space-y-1">
                      {rowErrors.name && (
                        <div className="flex items-center gap-1 text-xs text-monte-danger">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrors.name}
                        </div>
                      )}
                      {rowErrors.params && (
                        <div className="flex items-center gap-1 text-xs text-monte-danger">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrors.params}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary flex-1"
            >
              {submitting ? '保存中...' : (isEdit ? '保存修改' : '创建模板')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
