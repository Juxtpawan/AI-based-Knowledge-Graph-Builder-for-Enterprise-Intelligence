import React from 'react';
import { User, Tag, ArrowRightLeft, Mail, Scale, Calendar, Lightbulb, Fingerprint } from 'lucide-react';

export default function NodeIdentity({ element }) {
    if (!element) return null;
    
    const isNode = !element.isRelationship;
    
    // Forensic Mapping (Sync with BloomGraphCanvas)
    const resolveForensicType = () => {
        if (!isNode) return 'Link';
        const rawLabel = element.labels?.[0] || 'Entity';
        const entityType = element.properties?.entity_type?.toUpperCase() || '';
        
        if (['Employee', 'Email', 'Topic', 'Event', 'Legal'].includes(rawLabel)) return rawLabel;

        if (entityType.includes('LEGAL') || entityType.includes('REGULATION') || entityType.includes('CASE')) return 'Legal';
        if (entityType.includes('DATE') || entityType.includes('TIME') || entityType.includes('MEETING') || entityType.includes('EVENT')) return 'Event';
        if (entityType.includes('PERSON') || entityType.includes('ORG') || entityType.includes('EMPLOYEE')) return 'Employee';
        if (entityType.includes('PRICE') || entityType.includes('METRIC') || entityType.includes('COMMODITY') || entityType.includes('INDUSTRY')) return 'Topic';
        if (entityType.includes('SUBJECT') || entityType.includes('EMAIL') || entityType.includes('COMMUNICATION')) return 'Email';

        return rawLabel === 'Entity' ? 'Entity' : rawLabel;
    };

    const forensicType = resolveForensicType();

    // Visual Palette Mapping
    const typeConfig = {
        Employee: { color: '#6366f1', icon: User, glow: 'shadow-indigo-500/20', label: 'Personnel' },
        Email:    { color: '#f59e0b', icon: Mail, glow: 'shadow-amber-500/20', label: 'Communication' },
        Topic:    { color: '#14b8a6', icon: Lightbulb, glow: 'shadow-teal-500/20', label: 'Semantic' },
        Event:    { color: '#10b981', icon: Calendar, glow: 'shadow-emerald-500/20', label: 'Temporal' },
        Legal:    { color: '#ef4444', icon: Scale, glow: 'shadow-red-500/20', label: 'Compliance' },
        Entity:   { color: '#0ea5e9', icon: Tag, glow: 'shadow-sky-500/20', label: 'Categorical' },
        Link:     { color: '#64748b', icon: ArrowRightLeft, glow: 'shadow-slate-500/20', label: 'Relationship' },
        Default:  { color: '#0ea5e9', icon: Fingerprint, glow: 'shadow-sky-500/20', label: 'Investigation' }
    };

    const config = typeConfig[forensicType] || typeConfig.Default;
    const Icon = config.icon;

    return (
        <div className="mb-8 flex items-start gap-6 group">
            <div 
                className={`p-5 rounded-3xl border shadow-2xl transition-all duration-500 scale-110 flex items-center justify-center ${config.glow}`}
                style={{ 
                    backgroundColor: `${config.color}15`, 
                    borderColor: `${config.color}40`,
                    color: config.color
                }}
            >
                <Icon size={28} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-bold text-white text-2xl leading-tight font-display tracking-tight mb-2 truncate">
                    {isNode ? (element.properties?.name || element.properties?.subject || element.id) : element.type}
                </h3>
                
                <div className="flex items-center gap-2.5">
                    <div 
                        className="size-2 rounded-full animate-pulse" 
                        style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }}
                    />
                    <span 
                        className="text-[10px] uppercase tracking-[0.25em] font-black"
                        style={{ color: `${config.color}cc` }}
                    >
                        {isNode ? (
                            [
                                config.label, 
                                element.properties?.entity_type || element.properties?.role || 'Entity'
                            ].filter(Boolean).join(' • ')
                        ) : (
                            `Intelligence Link • ${element.type || 'Structural'}`
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
