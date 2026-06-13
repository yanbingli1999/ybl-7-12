import { useEffect, useState } from 'react';
import {
  BookTemplate, Pencil, Copy, Trash2, X, Filter, Clock, DollarSign,
  TrendingUp, Calendar, Settings, ChevronDown, Layers, Plus, Search,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Template, TemplateCategory, TemplateVariable, VariableType } from '../../shared/types.js';
import TemplateModal from './TemplateModal';

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; color: string; icon: any }> = {
  engineering: { label: '工程建设', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Calendar },
  software: { label: '软件开发', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Settings },
  finance: { label: '金融投资', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: TrendingUp },
  manufacturing: { label: '制造生产', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', icon: Layers },
  marketing: { label: '市场营销', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40', icon: DollarSign },
  other: { label: '其他', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Settings },
};

const VARIABLE_TYPE_CONFIG: Record<VariableType, { label: string; color: string; icon: any }> = {
  cost: { label: '成本', color: 'bg-red-500/20 text-red-300', icon: DollarSign },
  duration: { label: '工期', color: 'bg-amber-500/20 text-amber-300', icon: Clock },
  revenue: { label: '收益', color: 'bg-emerald-500/20 text-emerald-300', icon: TrendingUp },
  custom: { label: '自定义', color: 'bg-indigo-500/20 text-indigo-300', icon: Settings },
};

interface TemplateLibraryProps {
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
}

export default function TemplateLibrary({ onClose, onUseTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.templates.list();
      setTemplates(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败';
      setLoadError(msg);
      console.error('加载模板失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此模板吗？')) return;
    setDeletingId(id);
    try {
      await api.templates.remove(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const copied = await api.templates.copy(id);
      setTemplates(prev => [...prev, copied]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '复制失败');
    }
  };

  const handleSaveEdit = async (template: Template) => {
    if (!editingTemplate) return;
    const updated = await api.templates.update(editingTemplate.id, {
      name: template.name,
      category: template.category,
      description: template.description,
      variables: template.variables,
    });
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updated : t));
    setEditingTemplate(null);
  };

  const handleCreate = async (template: Template) => {
    const created = await api.templates.create({
      name: template.name,
      category: template.category,
      description: template.description,
      variables: template.variables,
    });
    setTemplates(prev => [...prev, created]);
    setShowCreateModal(false);
  };

  const filteredTemplates = templates.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (searchText && !t.name.toLowerCase().includes(searchText.toLowerCase()) && !t.description.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const categoryCounts: Record<string, number> = { all: templates.length };
  for (const t of templates) {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-monte-muted hover:text-white hover:bg-monte-border transition-all z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-10">
          <div className="p-2.5 rounded-xl bg-monte-accent/15 border border-monte-accent/30">
            <BookTemplate className="w-6 h-6 text-monte-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">参数模板库</h2>
            <p className="text-xs text-monte-muted">保存变量配置为模板，快速创建新项目</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-monte-muted" />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索模板名称或描述..."
              className="input !pl-9"
            />
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" />
            新建模板
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-monte-muted" />
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterCategory === 'all' ? 'bg-monte-accent/20 text-monte-accent border-monte-accent/40' : 'bg-monte-bg text-monte-muted border-monte-border hover:border-monte-accent/40'}`}
          >
            全部 ({categoryCounts.all || 0})
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [TemplateCategory, typeof CATEGORY_CONFIG[TemplateCategory]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${filterCategory === key ? 'bg-monte-accent/20 text-monte-accent border-monte-accent/40' : 'bg-monte-bg text-monte-muted border-monte-border hover:border-monte-accent/40'}`}
            >
              {cfg.label} ({categoryCounts[key] || 0})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {loadError && (
            <div className="p-3 rounded-lg bg-monte-danger/10 border border-monte-danger/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-monte-danger flex-shrink-0" />
                <span className="text-sm text-monte-danger font-medium">加载失败：{loadError}</span>
              </div>
              <button onClick={loadTemplates} className="btn-secondary text-xs !py-1 !px-2.5 whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" />
                重试
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-monte-muted">
              <div className="animate-spin w-6 h-6 border-2 border-monte-accent border-t-transparent rounded-full mr-3" />
              加载中...
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20 text-monte-muted">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-monte-danger/10 border border-monte-danger/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-monte-danger" />
              </div>
              <p className="text-monte-danger font-medium mb-2">模板加载失败</p>
              <p className="text-sm text-monte-muted mb-4">{loadError}</p>
              <button onClick={loadTemplates} className="btn-secondary text-sm">
                <RefreshCw className="w-4 h-4" />
                重新加载
              </button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-monte-muted">
              <BookTemplate className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{searchText || filterCategory !== 'all' ? '没有匹配的模板' : '还没有模板，点击右上角创建'}</p>
            </div>
          ) : (
            filteredTemplates.map(t => {
              const catCfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.other;
              const CatIcon = catCfg.icon;
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id} className="card !p-4 border-monte-border hover:border-monte-accent/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base font-semibold text-white truncate">{t.name}</h3>
                        <span className={`badge border ${catCfg.color}`}>
                          <CatIcon className="w-3 h-3 mr-1" />
                          {catCfg.label}
                        </span>
                        <span className="badge bg-monte-accent/15 text-monte-accent border border-monte-accent/30">
                          {t.variables.length} 变量
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-monte-muted mb-2 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-monte-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(t.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          {t.variables.filter(v => v.type === 'cost').length > 0 && <><DollarSign className="w-3 h-3 text-red-400" />{t.variables.filter(v => v.type === 'cost').length}成本</>}
                        </span>
                        <span className="flex items-center gap-1">
                          {t.variables.filter(v => v.type === 'revenue').length > 0 && <><TrendingUp className="w-3 h-3 text-emerald-400" />{t.variables.filter(v => v.type === 'revenue').length}收益</>}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onUseTemplate(t)}
                        className="btn-primary text-xs !px-3 !py-1.5"
                      >
                        使用
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : t.id)} className="p-1.5 rounded-md text-monte-muted hover:text-white hover:bg-monte-border transition-colors" title="展开详情">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => setEditingTemplate(t)} className="p-1.5 rounded-md text-monte-muted hover:text-monte-accent hover:bg-monte-accent/15 transition-colors" title="编辑">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCopy(t.id)} className="p-1.5 rounded-md text-monte-muted hover:text-monte-safe hover:bg-monte-safe/15 transition-colors" title="复制">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="p-1.5 rounded-md text-monte-muted hover:text-monte-danger hover:bg-monte-danger/15 transition-colors disabled:opacity-50" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-monte-border/50">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="border-b border-monte-border/50">
                              <th className="th">变量名</th>
                              <th className="th">类型</th>
                              <th className="th">最小值</th>
                              <th className="th">最可能</th>
                              <th className="th">最大值</th>
                              <th className="th">权重</th>
                              <th className="th">单位</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-monte-border/30">
                            {t.variables.map((v, vi) => {
                              const vtCfg = VARIABLE_TYPE_CONFIG[v.type];
                              const VtIcon = vtCfg.icon;
                              return (
                                <tr key={vi} className="hover:bg-monte-bg/40 transition-colors">
                                  <td className="td font-medium text-white">{v.name}</td>
                                  <td className="td">
                                    <span className={`badge ${vtCfg.color}`}>
                                      <VtIcon className="w-3 h-3 mr-1" />
                                      {vtCfg.label}
                                    </span>
                                  </td>
                                  <td className="td font-mono text-monte-muted">{v.min}</td>
                                  <td className="td font-mono text-monte-accent font-medium">{v.mostLikely}</td>
                                  <td className="td font-mono text-monte-muted">{v.max}</td>
                                  <td className="td font-mono">
                                    <span className={v.weight < 0 ? 'text-monte-danger' : 'text-monte-safe'}>
                                      {v.weight > 0 ? '+' : ''}{v.weight}
                                    </span>
                                  </td>
                                  <td className="td text-monte-muted">{v.unit || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingTemplate && (
        <TemplateModal
          template={editingTemplate}
          onSave={handleSaveEdit}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {showCreateModal && (
        <TemplateModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
