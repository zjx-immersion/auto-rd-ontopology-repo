import React from 'react';
import { useParams } from 'react-router-dom';
import SchemaEditor from '../components/SchemaEditor';

/**
 * Schema 编辑器页面
 */
const SchemaEditorPage = () => {
  const { graphId } = useParams();

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <SchemaEditor graphId={graphId} />
    </div>
  );
};

export default SchemaEditorPage;
