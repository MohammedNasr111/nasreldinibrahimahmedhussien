import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const BRAND_COLORS = [
  { label: 'Navy', value: '#1a2a4a' },
  { label: 'Gold', value: '#b8960c' },
  { label: 'Dark', value: '#1c1c1c' }
];

export default function RichTextToolbar() {
  const { isEditor } = useAuth();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);
  const savedRange = useRef(null);

  useEffect(() => {
    if (!isEditor) return;

    const saveSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setVisible(false);
        return;
      }
      const node = sel.anchorNode;
      const editable = node?.nodeType === 3
        ? node.parentElement?.closest('.editable-content')
        : node?.closest?.('.editable-content');
      if (!editable) {
        setVisible(false);
        return;
      }
      saveSelection();
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPos({
        top: rect.top + window.scrollY - 48,
        left: rect.left + window.scrollX + rect.width / 2
      });
      setVisible(true);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [isEditor]);

  if (!isEditor || !visible) return null;

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, val = null) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
  };

  const applyHeading = (tag) => {
    restoreSelection();
    document.execCommand('formatBlock', false, tag);
  };

  const applyColor = (color) => {
    restoreSelection();
    document.execCommand('foreColor', false, color);
  };

  return (
    <div
      ref={toolbarRef}
      className="rte-toolbar"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" onClick={() => exec('bold')} title="Bold"><strong>B</strong></button>
      <button type="button" className="rte-heading-btn" onClick={() => applyHeading('h3')} title="Title">Title</button>
      <button type="button" className="rte-heading-btn" onClick={() => applyHeading('h4')} title="Subtitle">Subtitle</button>
      <span className="rte-sep" />
      <button type="button" onClick={() => exec('justifyLeft')} title="Align left">&#8676;</button>
      <button type="button" onClick={() => exec('justifyCenter')} title="Align center">&#8596;</button>
      <button type="button" onClick={() => exec('justifyRight')} title="Align right">&#8677;</button>
      <span className="rte-sep" />
      <div className="rte-colors">
        {BRAND_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="rte-color-swatch"
            style={{ background: c.value }}
            title={c.label}
            onClick={() => applyColor(c.value)}
          />
        ))}
        <label className="rte-color-custom" title="Custom color">
          <input type="color" defaultValue="#1a2a4a" onInput={(e) => applyColor(e.target.value)} />
        </label>
      </div>
    </div>
  );
}
