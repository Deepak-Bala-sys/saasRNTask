import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import App from '../App';

// Test rendering of the App component
test('renders correctly', () => {
  const {getByText, getByTestId} = render(<App />);

  // Check if the initial prompt text is present
  expect(
    getByText('Kindly upload spreadsheet or image attachment.'),
  ).toBeTruthy();

  // Check if buttons are rendered
  expect(getByText('Import Spreadsheet')).toBeTruthy();
  expect(getByText('Add Attachment')).toBeTruthy();
  expect(getByText('Export Spreadsheet')).toBeTruthy();
});

// Test file picking
test('picking a file updates the prompt text', async () => {
  // Mock the file picking functionality
  jest.mock('react-native-document-picker', () => ({
    pickSingle: jest.fn().mockResolvedValue({
      uri: 'file://path/to/spreadsheet.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  }));

  const {getByText, findByText} = render(<App />);

  // Simulate picking a file
  fireEvent.press(getByText('Import Spreadsheet'));

  // Wait for the prompt text to be updated
  await waitFor(() => {
    expect(findByText('Spreadsheet imported successfully.')).toBeTruthy();
  });
});

// Test adding an image attachment
test('adding an image attachment updates the image', async () => {
  // Mock the image picking functionality
  jest.mock('react-native-document-picker', () => ({
    pickSingle: jest.fn().mockResolvedValue({
      uri: 'file://path/to/image.jpg',
      type: 'image/jpeg',
    }),
  }));

  const {getByText, getByTestId} = render(<App />);

  // Simulate picking an image
  fireEvent.press(getByText('Add Attachment'));

  // Check if the image is rendered
  expect(getByTestId('image')).toBeTruthy();
});

// Test export functionality
test('exporting a spreadsheet shows an alert', () => {
  // Mock the alert function
  jest.spyOn(global, 'alert').mockImplementation(() => {});

  const {getByText} = render(<App />);

  // Simulate export action
  fireEvent.press(getByText('Export Spreadsheet'));

  // Check if alert is shown
  expect(global.alert).toHaveBeenCalledWith('No data available for export.');

  // Clean up mock
  jest.restoreAllMocks();
});
