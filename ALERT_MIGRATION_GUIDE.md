# Dispatcher App - Alert Migration Guide

## Quick Reference

### Import the Hook

```javascript
import { useAlert } from '../contexts/AlertContext';

const MyComponent = () => {
  const { showAlert, showToast } = useAlert();
  // ...
};
```

## Decision Tree: Which Alert to Use?

```
Does the user need to take action or acknowledge?
├─ YES → Use showAlert() (Modal Dialog)
│   ├─ Is it a confirmation? → Use 2 buttons (Cancel + Action)
│   ├─ Is it an error? → Use 1 button (OK) with type 'error'
│   └─ Is it a warning? → Use 1 button (OK) with type 'warning'
│
└─ NO → Use showToast() (Auto-dismiss)
    ├─ Is it a success? → Use type 'success'
    ├─ Is it an error? → Use type 'error'
    ├─ Is it a warning? → Use type 'warning'
    └─ Is it informational? → Use type 'info'
```

## Migration Patterns

### Pattern 1: Simple Alert → Modal Dialog

**Before:**

```javascript
alert('Failed to save. Please try again.');
```

**After:**

```javascript
showAlert(
  'Error',
  'Failed to save. Please try again.',
  [{ text: 'OK' }],
  'error'
);
```

### Pattern 2: Simple Alert → Toast

**Before:**

```javascript
alert('Call sent!');
```

**After:**

```javascript
showToast('Call sent!', 'success');
```

### Pattern 3: window.confirm → Confirmation Dialog

**Before:**

```javascript
if (window.confirm('Are you sure you want to delete this?')) {
  deleteItem();
}
```

**After:**

```javascript
showAlert(
  'Confirm Delete',
  'Are you sure you want to delete this?',
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => deleteItem(),
    },
  ],
  'warning'
);
```

### Pattern 4: Error in Try-Catch → Modal Dialog

**Before:**

```javascript
try {
  await saveData();
  alert('Saved successfully');
} catch (error) {
  alert(`Failed to save: ${error.message}`);
}
```

**After:**

```javascript
try {
  await saveData();
  showToast('Saved successfully', 'success');
} catch (error) {
  showAlert(
    'Error',
    `Failed to save: ${error.message}`,
    [{ text: 'OK' }],
    'error'
  );
}
```

### Pattern 5: Connection Error → Modal Dialog

**Before:**

```javascript
if (signalRConnection.state !== 'Connected') {
  alert('SignalR not connected. Please refresh.');
  return;
}
```

**After:**

```javascript
if (signalRConnection.state !== 'Connected') {
  showAlert(
    'Connection Error',
    'SignalR not connected. Please refresh the page.',
    [{ text: 'OK' }],
    'error'
  );
  return;
}
```

## API Reference

### showAlert(title, message, buttons, type)

**Parameters:**

- `title` (string) - Alert dialog title
- `message` (string) - Alert message body (supports `\n` for line breaks)
- `buttons` (array) - Array of button objects
  - `text` (string) - Button label
  - `onPress` (function, optional) - Button click handler
  - `style` (string, optional) - Button style: `'cancel'`, `'destructive'`, or default (primary)
- `type` (string, optional) - Alert type: `'success'`, `'error'`, `'warning'`, `'info'` (default: `'info'`)

**Example:**

```javascript
showAlert(
  'Delete User',
  'This action cannot be undone. Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteUser() },
  ],
  'warning'
);
```

### showToast(message, type, duration)

**Parameters:**

- `message` (string) - Toast message text
- `type` (string, optional) - Toast type: `'success'`, `'error'`, `'warning'`, `'info'` (default: `'info'`)
- `duration` (number, optional) - Duration in milliseconds (default: 3000)

**Example:**

```javascript
showToast('Driver updated successfully', 'success');
showToast('Connection lost', 'error', 5000);
```

## Alert Types & Colors

| Type      | Color            | Icon | Use Case                |
| --------- | ---------------- | ---- | ----------------------- |
| `success` | Green (#4caf50)  | ✓    | Successful operations   |
| `error`   | Red (#f44336)    | ✕    | Errors, failures        |
| `warning` | Orange (#ff9800) | ⚠    | Warnings, confirmations |
| `info`    | Blue (#2196f3)   | ℹ    | Informational messages  |

## Button Styles

| Style         | Color | Use Case                           |
| ------------- | ----- | ---------------------------------- |
| (default)     | Blue  | Primary action (OK, Confirm, Yes)  |
| `cancel`      | Gray  | Cancel action                      |
| `destructive` | Red   | Dangerous actions (Delete, Remove) |

## Complete Migration Examples

### RideHistory.jsx - Cancel Call

```javascript
const handleCancelCall = async (rideId) => {
  showAlert(
    'Cancel Call',
    'Are you sure you want to cancel this call?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          try {
            await signalRConnection.invoke('CallCanceled', rideId);
            showToast('Call cancelled successfully', 'success');
            loadRides();
          } catch (error) {
            showAlert(
              'Error',
              `Failed to cancel: ${error.message}`,
              [{ text: 'OK' }],
              'error'
            );
          }
        },
      },
    ],
    'warning'
  );
};
```

### NewCallWizard.jsx - Form Validation

```javascript
const addStop = () => {
  if (formData.additionalStops.length >= 10) {
    showAlert(
      'Maximum Stops',
      'Maximum 10 stops allowed',
      [{ text: 'OK' }],
      'warning'
    );
    return;
  }
  // Add stop logic...
};

const handleSubmit = async () => {
  try {
    await createRide(formData);
    showToast('Call sent!', 'success');
    clearForm();
  } catch (error) {
    showAlert(
      'Error',
      'Failed to create ride. Please try again.',
      [{ text: 'OK' }],
      'error'
    );
  }
};
```

### DriverManager.jsx - Warning with Details

```javascript
const handleSaveDriver = async () => {
  try {
    const response = await adminAPI.drivers.create(formData);

    if (response && response.warning) {
      showAlert(
        'Warning',
        `${response.warning}\n\nTemporary Password: ${response.tempPassword}`,
        [{ text: 'OK' }],
        'warning'
      );
    }

    loadDrivers();
  } catch (error) {
    showAlert(
      'Error',
      'Failed to save driver. Please try again.',
      [{ text: 'OK' }],
      'error'
    );
  }
};
```

## Common Mistakes to Avoid

❌ **Don't use toast for errors requiring acknowledgment**

```javascript
// BAD - user might miss important error
showToast('Failed to save your data', 'error');
```

✅ **Use modal dialog instead**

```javascript
// GOOD - user must acknowledge
showAlert('Error', 'Failed to save your data', [{ text: 'OK' }], 'error');
```

❌ **Don't use modal for simple success messages**

```javascript
// BAD - unnecessary click required
showAlert('Success', 'Ride created', [{ text: 'OK' }], 'success');
```

✅ **Use toast instead**

```javascript
// GOOD - auto-dismisses
showToast('Ride created', 'success');
```

❌ **Don't forget to specify alert type**

```javascript
// BAD - defaults to blue 'info' icon
showAlert('Error', 'Something went wrong', [{ text: 'OK' }]);
```

✅ **Always specify type for errors/warnings**

```javascript
// GOOD - red error icon
showAlert('Error', 'Something went wrong', [{ text: 'OK' }], 'error');
```

## Keyboard Shortcuts

When a modal dialog is open:

- **Enter** → Clicks the primary (non-cancel) button
- **Escape** → Clicks the cancel button (or first button if no cancel)

## Testing Your Alerts

1. **Test modal appearance**: Does the icon color match the type?
2. **Test button clicks**: Do onPress handlers execute correctly?
3. **Test keyboard shortcuts**: Does Enter/Escape work?
4. **Test toast timing**: Does it auto-dismiss after 3 seconds?
5. **Test click-to-dismiss**: Can you click toast to dismiss early?
6. **Test overlay click**: Does clicking outside close the modal?

---

Need help? Check `ALERT_MIGRATION_COMPLETE.md` for migration statistics and examples.
