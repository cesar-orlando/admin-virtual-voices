import React from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

export function DataTableTab({
  loading,
  error,
  data,
  onShowMessages,
}: {
  loading: boolean;
  error: string | null;
  data: any;
  onShowMessages: (messages: any[]) => void;
}) {
  function renderTable(obj: any) {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <p>No data</p>;
      return (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(obj[0]).map((key) => (
                  key === 'tableSlug' || key === '_id' || key === 'botActive' || key === 'createdAt' || key === 'updatedAt' || key === '__v'? null : (
                    <TableCell key={key}>{key.toUpperCase()}</TableCell>
                  )
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {obj.map((row: any, idx: number) => {
                let lastMsg = '';
                if (Array.isArray(row.messages) && row.messages.length > 0) {
                  const last = row.messages[row.messages.length - 1];
                  lastMsg = typeof last === 'object' && last.body ? last.body : '';
                }
                return (
                  <TableRow key={idx}>
                    {Object.entries(row).map(([key, val], i) => 
                      key === 'messages' || key === 'tableSlug' || key === '_id' || key === 'botActive' || key === 'createdAt' || key === 'updatedAt' || key === '__v' ? null : (
                        <TableCell key={i}>{typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}</TableCell>
                      )
                    )}
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', wordBreak: 'break-word', marginBottom: 8 }}>{lastMsg}</div>
                        {Array.isArray(row.messages) && row.messages.length > 0 && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onShowMessages(row.messages)}
                          >
                            Ver mensajes ({row.messages.length})
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    {/* <TableCell> ...acciones... </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 30 }}>
          <h3>{key}</h3>
          {renderTable(value)}
        </div>
      ));
    } else {
      return <pre>{JSON.stringify(obj, null, 2)}</pre>;
    }
  }

  return (
    <>
      <h1 style={{ textAlign: 'center', width: '100%' }}>Mensajes</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <div style={{
        width: '100%',
        maxWidth: 900,
        overflowX: 'auto',
        display: 'flex',
        justifyContent: 'center',
        margin: '0 auto'
      }}>
        {data && renderTable(data)}
      </div>
    </>
  );
}