import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, BookmarkCheck, ClipboardPlus, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import DismissibleBanner from '../../components/DismissibleBanner';
import { useAuth } from '../../hooks/useAuth';
import {
  getCachedResourceCollection,
  createManagedResource,
  getResources,
  deleteManagedResource,
  getManagedResources,
  prefetchResourceById,
  primeResourceDetailCache,
  setCachedResourceCollection,
  updateManagedResource
} from '../../lib/mentalHealth';
import { getResourceTypePresentation } from '../../lib/resourcePresentation';

const RESOURCE_TYPE_OPTIONS = ['Article', 'Guide', 'Video', 'Infographic', 'Podcast'];
const STATUS_OPTIONS = ['Published', 'Draft', 'Archived'];
const FILTER_TYPE_OPTIONS = ['All', ...RESOURCE_TYPE_OPTIONS];
const FILTER_STATUS_OPTIONS = ['All', ...STATUS_OPTIONS];

function buildInitialForm(user) {
  return {
    title: '',
    description: '',
    type: 'Article',
    status: 'Published',
    category: 'Mental Health',
    author: user?.name || '',
    content: '',
    tags: '',
    videoUrl: ''
  };
}

function validateResourceForm(values) {
  const errors = {};

  if (!values.title.trim()) errors.title = 'Title is required.';
  else if (values.title.trim().length < 5) errors.title = 'Title must be at least 5 characters.';
  else if (values.title.trim().length > 120) errors.title = 'Title cannot exceed 120 characters.';

  if (!values.description.trim()) errors.description = 'Description is required.';
  else if (values.description.trim().length < 20) errors.description = 'Description must be at least 20 characters.';
  else if (values.description.trim().length > 240) errors.description = 'Description cannot exceed 240 characters.';

  if (!values.content.trim()) errors.content = 'Content is required.';
  else if (values.content.trim().length < 40) errors.content = 'Content must be at least 40 characters.';

  if (!values.author.trim()) errors.author = 'Author name is required.';

  if (!RESOURCE_TYPE_OPTIONS.includes(values.type)) errors.type = 'Select a valid type.';
  if (!STATUS_OPTIONS.includes(values.status)) errors.status = 'Select a valid status.';

  if (values.tags.length > 120) errors.tags = 'Tags cannot exceed 120 characters.';

  if (values.type === 'Video' && !values.videoUrl.trim()) {
    errors.videoUrl = 'Video URL is required for video resources.';
  } else if (values.type !== 'Video' && values.videoUrl.trim()) {
    errors.videoUrl = 'Video URL can only be added when type is Video.';
  } else if (values.videoUrl.trim() && !/^https?:\/\//i.test(values.videoUrl.trim())) {
    errors.videoUrl = 'Video URL must start with http:// or https://';
  }

  return errors;
}

function normalizeResourcePayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    status: values.status,
    category: 'Mental Health',
    author: values.author.trim(),
    content: values.content.trim(),
    tags: values.tags.trim(),
    videoUrl: values.videoUrl.trim()
  };
}

export default function CounselorResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState(() => getCachedResourceCollection('counselor-managed-resources', []));
  const [sharedResources, setSharedResources] = useState(() => getCachedResourceCollection('counselor-shared-resources', []));
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterError, setFilterError] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState({ message: '', tone: 'success' });
  const [showForm, setShowForm] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [pendingDeleteResource, setPendingDeleteResource] = useState(null);
  const [formValues, setFormValues] = useState(() => buildInitialForm(user));
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const editorSectionRef = useRef(null);

  const loadResources = useCallback(async (options = {}) => {
    try {
      const [managedData, publicData] = await Promise.all([
        getManagedResources({ category: 'Mental Health', limit: 60 }),
        getResources({ category: 'Mental Health', limit: 60 })
      ]);
      const managedResources = Array.isArray(managedData?.resources) ? managedData.resources : [];
      const publicResources = Array.isArray(publicData?.resources) ? publicData.resources : [];

      setResources(managedResources);
      setSharedResources(publicResources);
      setCachedResourceCollection('counselor-managed-resources', managedResources);
      setCachedResourceCollection('counselor-shared-resources', publicResources);
      if (!options.silent) {
        setError('');
      }
    } catch (err) {
      if (!options.silent) {
        setError(err.message || 'Failed to load counselor resources');
      }
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    setFormValues((current) => ({
      ...current,
      author: current.author || user?.name || ''
    }));
  }, [user?.name]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch = !query
        || resource.title?.toLowerCase().includes(query)
        || resource.description?.toLowerCase().includes(query)
        || resource.type?.toLowerCase().includes(query)
        || resource.tags?.some?.((tag) => `${tag}`.toLowerCase().includes(query));

      const matchesType = typeFilter === 'All' || resource.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || resource.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, searchQuery, statusFilter, typeFilter]);

  const filteredSharedResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sharedResources.filter((resource) => {
      const matchesSearch = !query
        || resource.title?.toLowerCase().includes(query)
        || resource.description?.toLowerCase().includes(query)
        || resource.type?.toLowerCase().includes(query)
        || resource.tags?.some?.((tag) => `${tag}`.toLowerCase().includes(query));

      const matchesType = typeFilter === 'All' || resource.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || resource.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, sharedResources, statusFilter, typeFilter]);

  const duplicateResource = useMemo(() => {
    const normalizedTitle = formValues.title.trim().toLowerCase();
    const normalizedContent = formValues.content.trim();

    return resources.find((resource) => (
      resource._id !== editingResourceId
      && (
        (normalizedTitle && resource.title?.trim().toLowerCase() === normalizedTitle)
        || (normalizedContent && resource.content?.trim() === normalizedContent)
      )
    ));
  }, [editingResourceId, formValues.content, formValues.title, resources]);

  useEffect(() => {
    setFormErrors((current) => {
      const nextErrors = validateResourceForm(formValues);

      if (duplicateResource) {
        if (duplicateResource.title?.trim().toLowerCase() === formValues.title.trim().toLowerCase()) {
          nextErrors.title = 'You already created a resource with this title.';
        }
        if (duplicateResource.content?.trim() === formValues.content.trim() && formValues.content.trim()) {
          nextErrors.content = 'This content already exists in one of your resources.';
        }
      }

      const changed = JSON.stringify(current) !== JSON.stringify(nextErrors);
      return changed ? nextErrors : current;
    });
  }, [duplicateResource, formValues]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilterError('');
      return;
    }

    if (!/^[a-zA-Z0-9\s:,.!?'"/()-]+$/.test(searchQuery.trim())) {
      setFilterError('Search can only include letters, numbers, spaces, and basic punctuation.');
      return;
    }

    if (searchQuery.trim().length > 80) {
      setFilterError('Search cannot exceed 80 characters.');
      return;
    }

    setFilterError('');
  }, [searchQuery]);

  function openCreateForm() {
    setShowForm(true);
    setEditingResourceId('');
    setFormValues(buildInitialForm(user));
    setFormTouched({});
    setFormErrors({});
    setError('');
    window.requestAnimationFrame(() => {
      editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openEditForm(resource) {
    setShowForm(true);
    setEditingResourceId(resource._id);
    setFormValues({
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'Article',
      status: resource.status || 'Published',
      category: 'Mental Health',
      author: resource.author || user?.name || '',
      content: resource.content || '',
      tags: Array.isArray(resource.tags) ? resource.tags.join(', ') : '',
      videoUrl: resource.videoUrl || ''
    });
    setFormTouched({});
    setFormErrors({});
    setError('');
    setPendingDeleteResource(null);
    window.requestAnimationFrame(() => {
      editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function closeForm() {
    setShowForm(false);
    setEditingResourceId('');
    setFormValues(buildInitialForm(user));
    setFormTouched({});
    setFormErrors({});
  }

  function touchField(name) {
    setFormTouched((current) => ({ ...current, [name]: true }));
  }

  function updateField(name, value) {
    const nextValues = {
      ...formValues,
      [name]: value,
      ...(name === 'type' && value !== 'Video' ? { videoUrl: '' } : {})
    };
    setFormValues(nextValues);
    setFormErrors(validateResourceForm(nextValues));
  }

  async function handleSaveResource(event) {
    event.preventDefault();

    const nextErrors = validateResourceForm(formValues);
    setFormTouched({
      title: true,
      description: true,
      type: true,
      status: true,
      author: true,
      content: true,
      tags: true,
      videoUrl: true
    });
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setSaving(true);
      const payload = normalizeResourcePayload(formValues);
      await (
        editingResourceId
        ? await updateManagedResource(editingResourceId, payload)
        : await createManagedResource(payload)
      );
      await loadResources({ silent: true });

      setBanner({
        message: editingResourceId ? 'Resource updated successfully.' : 'Resource created successfully.',
        tone: 'success'
      });
      closeForm();
    } catch (err) {
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
        setFormTouched((current) => ({
          ...current,
          ...Object.keys(err.data.errors).reduce((accumulator, key) => ({ ...accumulator, [key]: true }), {})
        }));
      } else {
        setError(err.message || 'Failed to save resource');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResource(resource) {
    try {
      setDeletingId(resource._id);
      await deleteManagedResource(resource._id);
      await loadResources({ silent: true });
      setBanner({ message: 'Resource deleted successfully.', tone: 'success' });
    } catch (err) {
      setError(err.message || 'Failed to delete resource');
    } finally {
      setDeletingId('');
      setPendingDeleteResource(null);
    }
  }

  const publishedCount = resources.filter((resource) => resource.status === 'Published').length;
  const draftCount = resources.filter((resource) => resource.status === 'Draft').length;

  function handlePrefetchResource(resource) {
    primeResourceDetailCache(resource);
    prefetchResourceById(resource._id).catch(() => {});
  }

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="mx-auto max-w-6xl space-y-6 px-8 pt-4">
        <section className="pharmacy-hero">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),260px] xl:items-end">
            <div className="min-w-0">
              <span className="pharmacy-pill bg-emerald-50 text-emerald-700">Counselor Resources</span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">Create, update, and retire the mental-health resources students discover from your counseling workspace.</h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-secondary-text">
                Published resources appear in the student self-help library. Drafts stay private so you can refine content before sharing it.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Published</p>
                <p className="mt-2 text-3xl font-semibold text-primary-text">{publishedCount}</p>
              </div>
              <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Drafts</p>
                <p className="mt-2 text-3xl font-semibold text-primary-text">{draftCount}</p>
              </div>
            </div>
          </div>
        </section>

        <DismissibleBanner
          message={banner.message}
          tone={banner.tone}
          onClose={() => setBanner({ message: '', tone: 'success' })}
        />

        {error && (
          <DismissibleBanner
            message={error}
            tone="error"
            onClose={() => setError('')}
          />
        )}

        <section ref={editorSectionRef} className="pharmacy-panel p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <ClipboardPlus className="h-5 w-5" />
                </span>
                <span className="pharmacy-pill bg-cyan-50 text-cyan-700">
                  Resource Editor
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-primary-text">{editingResourceId ? 'Update resource' : 'Add a new resource'}</h2>
              <p className="mt-3 text-sm leading-6 text-secondary-text">
                Keep counselor-owned resource content current without leaving the counseling workspace.
              </p>
            </div>

            {!showForm ? (
              <button type="button" onClick={openCreateForm} className="pharmacy-primary whitespace-nowrap">
                <Plus className="h-4 w-4" />
                Create resource
              </button>
            ) : null}
          </div>

          {showForm && (
            <form onSubmit={handleSaveResource} className="mt-6 space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Title</span>
                  <input
                    type="text"
                    value={formValues.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    onBlur={() => touchField('title')}
                    className={`student-field ${formTouched.title && formErrors.title ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                    placeholder="Exam reset checklist for high-stress days"
                  />
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.title ? formErrors.title : ''}</div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Author</span>
                  <input
                    type="text"
                    value={formValues.author}
                    onChange={(event) => updateField('author', event.target.value)}
                    onBlur={() => touchField('author')}
                    className={`student-field ${formTouched.author && formErrors.author ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                    placeholder="Dr. Ava Thompson"
                  />
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.author ? formErrors.author : ''}</div>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Description</span>
                <textarea
                  value={formValues.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  onBlur={() => touchField('description')}
                  className={`student-field min-h-[8rem] resize-y ${formTouched.description && formErrors.description ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                  placeholder="Give students a short preview of what this resource helps them with."
                />
                <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.description ? formErrors.description : ''}</div>
              </label>

              <div className="grid gap-5 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Type</span>
                  <select
                    value={formValues.type}
                    onChange={(event) => updateField('type', event.target.value)}
                    onBlur={() => touchField('type')}
                    className={`student-field ${formTouched.type && formErrors.type ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                  >
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.type ? formErrors.type : ''}</div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Status</span>
                  <select
                    value={formValues.status}
                    onChange={(event) => updateField('status', event.target.value)}
                    onBlur={() => touchField('status')}
                    className={`student-field ${formTouched.status && formErrors.status ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.status ? formErrors.status : ''}</div>
                </label>

                {formValues.type === 'Video' ? (
                  <label className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Video URL</span>
                    <input
                      type="text"
                      value={formValues.videoUrl}
                      onChange={(event) => updateField('videoUrl', event.target.value)}
                      onBlur={() => touchField('videoUrl')}
                      className={`student-field ${formTouched.videoUrl && formErrors.videoUrl ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                      placeholder="https://..."
                    />
                    <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.videoUrl ? formErrors.videoUrl : ''}</div>
                  </label>
                ) : (
                  <div className="rounded-[1.5rem] border border-white/80 bg-white/60 p-4 text-sm leading-6 text-secondary-text">
                    Video URL becomes available only when the resource type is set to Video.
                  </div>
                )}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),280px]">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Content</span>
                  <textarea
                    value={formValues.content}
                    onChange={(event) => updateField('content', event.target.value)}
                    onBlur={() => touchField('content')}
                    className={`student-field min-h-[13rem] resize-y ${formTouched.content && formErrors.content ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                    placeholder="Write the full article, guide, transcript, or activity instructions here."
                  />
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.content ? formErrors.content : ''}</div>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Tags</span>
                  <textarea
                    value={formValues.tags}
                    onChange={(event) => updateField('tags', event.target.value)}
                    onBlur={() => touchField('tags')}
                    className={`student-field min-h-[13rem] resize-y ${formTouched.tags && formErrors.tags ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                    placeholder="stress relief, sleep, grounding"
                  />
                  <div className="min-h-[1.25rem] text-sm text-red-500">{formTouched.tags ? formErrors.tags : ''}</div>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="pharmacy-primary">
                  {saving ? 'Saving...' : editingResourceId ? 'Update resource' : 'Create resource'}
                </button>
                <button type="button" onClick={closeForm} className="pharmacy-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {!!resources.length && (
          <section className="pharmacy-panel p-6">
            <div className="grid gap-4 md:grid-cols-[minmax(0,_1.45fr)_240px_240px] md:items-start xl:grid-cols-[minmax(0,_1.55fr)_280px_280px]">
              <div className="space-y-2">
                <label className="block">
                  <span className="block min-h-[1rem] text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Search</span>
                  <span className="relative mt-2 block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className={`student-field pl-11 ${filterError ? 'border-red-300 text-red-700 focus:border-red-300 focus:ring-red-100' : ''}`}
                      placeholder="Search title, type, or tags"
                    />
                  </span>
                </label>
                <div className="min-h-[1.25rem] text-sm text-red-500">{filterError}</div>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="block min-h-[1rem] text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Type</span>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="student-field mt-2"
                  >
                    {FILTER_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option === 'All' ? 'All resource types' : option}</option>
                    ))}
                  </select>
                </label>
                <div className="min-h-[1.25rem]" />
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="block min-h-[1rem] text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="student-field mt-2"
                  >
                    {FILTER_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option === 'All' ? 'All statuses' : option}</option>
                    ))}
                  </select>
                </label>
                <div className="min-h-[1.25rem]" />
              </div>

            </div>

            <p className="mt-4 text-sm text-secondary-text">
              Showing {filteredResources.length} of {resources.length} your resource{resources.length === 1 ? '' : 's'} and {filteredSharedResources.length} of {sharedResources.length} published resource{sharedResources.length === 1 ? '' : 's'} in the common library.
            </p>
          </section>
        )}

        {!!resources.length && (
          <section className="pharmacy-panel overflow-hidden p-0">
            <div className="border-b border-white/70 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Your resource library</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary-text">Counselor-owned resources</h2>
                </div>
              </div>
            </div>
            <div className="max-h-[42rem] overflow-y-auto rounded-[2rem]">
              {filteredResources.length ? (
                filteredResources.map((resource, index) => (
                  <article
                    key={resource._id}
                    className={index === 0 ? 'flex flex-col gap-5 p-6 xl:flex-row xl:items-start xl:justify-between' : 'flex flex-col gap-5 border-t border-white/70 p-6 xl:flex-row xl:items-start xl:justify-between'}
                  >
                    {(() => {
                      const presentation = getResourceTypePresentation(resource.type);
                      const ResourceIcon = presentation.icon;
                      return (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                          <ResourceIcon className="h-5 w-5" />
                        </span>
                        <h2 className="text-2xl font-semibold text-primary-text">{resource.title}</h2>
                        <span className={resource.status === 'Published' ? 'pharmacy-pill bg-emerald-50 text-emerald-700' : resource.status === 'Draft' ? 'pharmacy-pill bg-amber-50 text-amber-700' : 'pharmacy-pill bg-slate-100 text-slate-600'}>
                          {resource.status}
                        </span>
                        <span className="pharmacy-pill bg-slate-100 text-slate-700">
                          {resource.type}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary-text">{resource.description}</p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">
                        {resource.type} • {resource.category} • {resource.author}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          to={`/counselor/resources/${resource._id}`}
                          state={{
                            backTo: '/counselor/resources',
                            backLabel: 'Back to resources',
                            resourcePreview: resource
                          }}
                          onMouseEnter={() => handlePrefetchResource(resource)}
                          onFocus={() => handlePrefetchResource(resource)}
                          className="pharmacy-secondary min-w-[9.5rem] justify-center gap-2"
                        >
                          <BookOpen className="h-4 w-4" />
                          Open resource
                        </Link>
                        <button type="button" onClick={() => openEditForm(resource)} className="pharmacy-secondary">
                          <Pencil className="h-4 w-4" />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteResource(resource)}
                          disabled={deletingId === resource._id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/90 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === resource._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>

                      {pendingDeleteResource?._id === resource._id && (
                        <div className="mt-5 rounded-[1.5rem] border border-rose-100 bg-rose-50/80 p-4">
                          <p className="text-sm font-semibold text-primary-text">Delete this resource?</p>
                          <p className="mt-2 text-sm leading-6 text-secondary-text">
                            This removes it from your counselor library and, if published, from the common library too.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteResource(resource)}
                              disabled={deletingId === resource._id}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === resource._id ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteResource(null)}
                              className="pharmacy-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                      );
                    })()}
                  </article>
                ))
              ) : (
                <div className="p-8 text-center text-secondary-text">No resources match the current filters.</div>
              )}
            </div>
          </section>
        )}

        {!resources.length && (
          <section className="pharmacy-panel p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-violet-100 text-violet-700">
                <Sparkles className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counselor library</p>
                <h3 className="mt-2 text-2xl font-semibold text-primary-text">Start your first resource</h3>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  No counselor-owned resources yet. Create one to start building your counseling library.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="pharmacy-panel overflow-hidden p-0">
          <div className="border-b border-white/70 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Shared resource library</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary-text">Common mental-health resources</h2>
                <p className="mt-2 text-sm leading-6 text-secondary-text">
                  The common library includes every published mental-health resource, including your own published items, while update and delete stay limited to your user-owned library above.
                </p>
              </div>

              <Link
                to="/counselor/resources/saved"
                state={{
                  initialFilter: 'Saved',
                  backTo: '/counselor/resources',
                  backLabel: 'Back to counselor resources'
                }}
                className="pharmacy-secondary whitespace-nowrap"
              >
                <BookmarkCheck className="h-4 w-4" />
                Open saved library
              </Link>
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-[2rem]">
            {filteredSharedResources.length ? (
              filteredSharedResources.map((resource, index) => (
                <article
                  key={resource._id}
                  className={index === 0 ? 'flex flex-col gap-5 p-6 xl:flex-row xl:items-start xl:justify-between' : 'flex flex-col gap-5 border-t border-white/70 p-6 xl:flex-row xl:items-start xl:justify-between'}
                >
                  {(() => {
                    const presentation = getResourceTypePresentation(resource.type);
                    const ResourceIcon = presentation.icon;
                    return (
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                        <ResourceIcon className="h-5 w-5" />
                      </span>
                      <h2 className="text-2xl font-semibold text-primary-text">{resource.title}</h2>
                      <span className="pharmacy-pill bg-sky-50 text-sky-700">Shared</span>
                      <span className="pharmacy-pill bg-slate-100 text-slate-700">{resource.type}</span>
                    </div>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary-text">{resource.description}</p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">
                      {resource.type} • {resource.category} • {resource.author}
                    </p>
                  </div>
                    );
                  })()}

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/counselor/resources/${resource._id}`}
                      state={{
                        backTo: '/counselor/resources',
                        backLabel: 'Back to resources',
                        resourcePreview: resource
                      }}
                      onMouseEnter={() => handlePrefetchResource(resource)}
                      onFocus={() => handlePrefetchResource(resource)}
                      className="pharmacy-secondary min-w-[10rem] justify-center gap-2"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Open resource
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="p-8 text-center text-secondary-text">No shared resources match the current filters.</div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
