import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {WebView} from 'react-native-webview';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import {Buffer} from 'buffer';

// Utility function to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Convert sheet to HTML for WebView display
const convertSheetToHtml = (sheet: any) => {
  const html = XLSX.utils.sheet_to_html(sheet, {
    header: 1,
    editable: true,
    cell: {
      style: {border: '1px solid black', padding: '8px', textAlign: 'center'},
    },
    emptyCellText: '',
  });

  return `
    <html>
      <head>
        <script src="https://cdn.grapecity.com/spreadjs/15.0.0/spread.sheets.all.min.js"></script>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
          }
          .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .spreadjs-container {
            flex: 1;
            width: 100%;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
            font-size: 24px; /* Increased font size for better readability */
          }
          th {
            background-color: #f2f2f2;
          }
          td {
            background-color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="spreadjs" class="spreadjs-container"></div>
          ${html}
        </div>
        <script>
          const spread = new GC.Spread.Sheets.Workbook(document.getElementById('spreadjs'));

          window.ReactNativeWebView.postMessage('SpreadJS initialized');

          window.exportSpreadsheet = function() {
            const json = spread.toJSON();
            const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(json))));
            window.ReactNativeWebView.postMessage('export:' + base64);
          };

          window.importSpreadsheet = function(base64Data) {
            try {
              const json = JSON.parse(decodeURIComponent(escape(atob(base64Data))));
              spread.fromJSON(json);
              window.ReactNativeWebView.postMessage('import:done');
            } catch (e) {
              console.error('Error importing spreadsheet:', e);
              window.ReactNativeWebView.postMessage('import:error');
            }
          };
        </script>
      </body>
    </html>
  `;
};

const App = () => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const pickFile = async () => {
    try {
      const res: DocumentPickerResponse = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
      });

      const filePath = res.uri!;
      const fileData = await RNFS.readFile(filePath, 'base64');
      const uint8Array = base64ToUint8Array(fileData);

      const binaryString = String.fromCharCode.apply(null, uint8Array);
      const workbook = XLSX.read(binaryString, {type: 'binary'});

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const htmlTable = convertSheetToHtml(worksheet);

      setHtmlContent(htmlTable);
      setImageData(null);
      Alert.alert('Success', 'Spreadsheet imported successfully.');
    } catch (err) {
      console.error('Error picking file:', err);
      if (DocumentPicker.isCancel(err)) {
        console.log('User canceled file picker');
      } else {
        Alert.alert('Error', 'An error occurred while picking the file.');
      }
    }
  };
  // Handle Image Attachments
  const handleAddAttachment = async () => {
    try {
      const res: DocumentPickerResponse = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });

      const filePath = res.uri!;
      const fileData = await RNFS.readFile(filePath, 'base64');
      const base64Image = `data:${res.type};base64,${fileData}`;
      setImageData(base64Image);
      setHtmlContent(null);
      Alert.alert('Success', 'Image attachment added successfully.');
    } catch (err) {
      console.error('Error adding attachment:', err);
    }
  };

  const handleExport = () => {
    if (imageData) {
      const reduceBase64 = imageData.slice(0, 1000);
      Alert.alert(
        'Export Success',
        `Spreadsheet exported successfully.\n\nBase64 Data:\n${reduceBase64.toString()}`,
      );
    } else {
      Alert.alert('Error', 'No data available for export.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {htmlContent ? (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{html: htmlContent}}
            style={styles.webview}
            onError={e => {
              console.error('WebView Error:', e.nativeEvent);
              Alert.alert(
                'WebView Error',
                'An error occurred while loading content.',
              );
            }}
          />
        ) : imageData ? (
          <Image source={{uri: imageData}} style={styles.image} />
        ) : (
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>
              Kindly upload spreadsheet or image attachment.
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickFile}>
          <Text style={styles.buttonText}>Import Spreadsheet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleAddAttachment}>
          <Text style={styles.buttonText}>Add Attachment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Text style={styles.buttonText}>Export Spreadsheet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  webview: {
    height: 400,
    width: '100%',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  promptText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;
