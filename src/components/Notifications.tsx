import React from "react";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export function Notifications({ notifications }: { notifications: string[] }) {
  return (
    <>
      {notifications.map((notification, idx) => (
        <Snackbar
          key={idx}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          autoHideDuration={5000}
          sx={{ mb: idx * 7 }}
        >
          <Alert severity="info" variant="filled" sx={{ width: '100%' }}>
            {notification}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}