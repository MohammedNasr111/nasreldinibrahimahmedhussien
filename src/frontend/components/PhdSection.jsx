import React, { useState } from 'react';
import EditableText from './EditableText';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { uid } from '../utils/api';

function RecordTable({ records, onUpdate, onRemove, showStatus }) {
  const { isEditor } = useAuth();

  if (records.length === 0 && !isEditor) {
    return <p className="empty-state" dir="rtl" lang="ar">لا توجد سجلات حتى الآن.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th dir="rtl" lang="ar">اسم الطالب</th>
            <th dir="rtl" lang="ar">عنوان الرسالة</th>
            <th>Year</th>
            <th dir="rtl" lang="ar">الجامعة</th>
            {showStatus && <th>Status</th>}
            {isEditor && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={rec.id}>
              <td>
                <EditableText
                  tag="span"
                  dir="rtl"
                  lang="ar"
                  value={rec.studentName}
                  onChange={(v) => onUpdate(i, { ...rec, studentName: v })}
                />
              </td>
              <td>
                <EditableText
                  tag="span"
                  dir="rtl"
                  lang="ar"
                  value={rec.thesisTitle}
                  onChange={(v) => onUpdate(i, { ...rec, thesisTitle: v })}
                />
              </td>
              <td>
                <EditableText
                  tag="span"
                  dir="ltr"
                  value={rec.year}
                  onChange={(v) => onUpdate(i, { ...rec, year: v })}
                />
              </td>
              <td>
                <EditableText
                  tag="span"
                  dir="rtl"
                  lang="ar"
                  value={rec.university}
                  onChange={(v) => onUpdate(i, { ...rec, university: v })}
                />
              </td>
              {showStatus && (
                <td>
                  <EditableText
                    tag="span"
                    dir="ltr"
                    value={rec.status || 'Completed'}
                    onChange={(v) => onUpdate(i, { ...rec, status: v })}
                  />
                </td>
              )}
              {isEditor && (
                <td>
                  <button type="button" className="btn-outline-danger btn-sm" onClick={() => onRemove(i)}>
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PhdSection({ data }) {
  const { isEditor } = useAuth();
  const { updateContent } = useContent();
  const [tab, setTab] = useState('supervised');

  const updateField = (field, value) => {
    updateContent((prev) => ({
      ...prev,
      phdSupervision: { ...prev.phdSupervision, [field]: value }
    }));
  };

  const updateList = (listKey, index, item) => {
    updateContent((prev) => {
      const list = [...prev.phdSupervision[listKey]];
      list[index] = item;
      return { ...prev, phdSupervision: { ...prev.phdSupervision, [listKey]: list } };
    });
  };

  const addRecord = (listKey) => {
    const newRec = {
      id: uid(),
      studentName: 'اسم الطالب',
      thesisTitle: 'عنوان الرسالة',
      year: '2024',
      university: 'IIUM',
      status: 'Completed'
    };
    updateContent((prev) => ({
      ...prev,
      phdSupervision: {
        ...prev.phdSupervision,
        [listKey]: [...prev.phdSupervision[listKey], newRec]
      }
    }));
  };

  const removeRecord = (listKey, index) => {
    updateContent((prev) => ({
      ...prev,
      phdSupervision: {
        ...prev.phdSupervision,
        [listKey]: prev.phdSupervision[listKey].filter((_, i) => i !== index)
      }
    }));
  };

  const listKey = tab === 'supervised' ? 'supervised' : 'vivaChair';

  return (
    <section id="phd" className="section section-phd">
      <div className="section-header">
        <EditableText
          tag="h2"
          className="section-title-ar"
          dir="rtl"
          lang="ar"
          value={data.sectionTitleAr}
          onChange={(v) => updateField('sectionTitleAr', v)}
        />
        <EditableText
          tag="p"
          className="section-title-en"
          dir="ltr"
          lang="en"
          value={data.sectionTitleEn}
          onChange={(v) => updateField('sectionTitleEn', v)}
        />
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${tab === 'supervised' ? 'active' : ''}`}
          onClick={() => setTab('supervised')}
        >
          <span dir="rtl" lang="ar">{data.supervisorTitleAr}</span>
          <span>{data.supervisorTitleEn}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'viva' ? 'active' : ''}`}
          onClick={() => setTab('viva')}
        >
          <span dir="rtl" lang="ar">{data.vivaTitleAr}</span>
          <span>{data.vivaTitleEn}</span>
        </button>
      </div>

      <RecordTable
        records={data[listKey]}
        showStatus={tab === 'supervised'}
        onUpdate={(i, item) => updateList(listKey, i, item)}
        onRemove={(i) => removeRecord(listKey, i)}
      />

      {isEditor && (
        <button type="button" className="btn-add" onClick={() => addRecord(listKey)}>
          + Add {tab === 'supervised' ? 'Supervised Student' : 'Viva Record'}
        </button>
      )}
    </section>
  );
}
