const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser')

const app = express();
const wsdlFilesDir = path.join(path.resolve(__dirname), 'dummyWsdl');

app.use((req, res, next) => {
  console.info(`${req.method} ${req.url}`);
  next();
});
app.use(bodyParser.text({
  type: '*/*',
}));

app.get('/ws/wsdl', (req, res) => {
  const wsdl = fs.readFileSync(path.join(wsdlFilesDir, 'wsdl.xml'));
  res.contentType('xml').send(wsdl);
});
app.get('/ws/sa.xsd', (req, res) => {
  const wsdl = fs.readFileSync(path.join(wsdlFilesDir, 'sa.xsd'));
  res.contentType('xml').send(wsdl);
});
app.post('/ws/service', (req, res) => {
  console.info(req.body);
  res.status(500).send();
});

app.listen(3000, () => {
  console.log('Wsdl can be found at http://localhost:3000/ws/wsdl');
});
