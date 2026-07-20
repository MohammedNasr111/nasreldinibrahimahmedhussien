import React, { useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function EditableText({
  value,
  onChange,
  className = '',
  dir,
  lang,
  tag: Tag = 'div',
  ...props
}) {
  const ref = useRef(null);
  const { isEditor } = useAuth();

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  if (!isEditor) {
    return (
      <Tag
        className={className}
        dir={dir}
        lang={lang}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        {...props}
      />
    );
  }

  return (
    <Tag
      ref={(el) => {
        ref.current = el;
        if (el && el.innerHTML !== (value || '')) {
          el.innerHTML = value || '';
        }
      }}
      className={`editable-content ${className}`}
      contentEditable
      suppressContentEditableWarning
      dir={dir}
      lang={lang}
      onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      {...props}
    />
  );
}
