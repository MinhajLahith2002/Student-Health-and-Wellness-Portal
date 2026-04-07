import { BookOpenText, FileText, Headphones, Image, Sparkles, Video } from 'lucide-react';

export function getResourceTypePresentation(type = '') {
  switch (type) {
    case 'Article':
      return {
        icon: FileText,
        badgeClass: 'bg-sky-100 text-sky-700'
      };
    case 'Guide':
      return {
        icon: BookOpenText,
        badgeClass: 'bg-violet-100 text-violet-700'
      };
    case 'Video':
      return {
        icon: Video,
        badgeClass: 'bg-cyan-100 text-cyan-700'
      };
    case 'Podcast':
      return {
        icon: Headphones,
        badgeClass: 'bg-amber-100 text-amber-700'
      };
    case 'Infographic':
      return {
        icon: Image,
        badgeClass: 'bg-emerald-100 text-emerald-700'
      };
    default:
      return {
        icon: Sparkles,
        badgeClass: 'bg-slate-100 text-slate-700'
      };
  }
}

export function getResourceLengthLabel(resource = {}) {
  return resource.type === 'Video'
    ? (resource.duration || 'Short watch')
    : (resource.readTime || 'Quick read');
}
