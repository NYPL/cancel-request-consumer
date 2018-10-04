const avro = require('avsc');
const schema = '{"name":"RecapCancelHoldRequest","type":"record","fields":[{"name":"id","type":"int"},{"name":"jobId","type":["null","string"]},{"name":"trackingId","type":["null","string"]},{"name":"patronBarcode","type":["null","string"]},{"name":"itemBarcode","type":["null","string"]},{"name":"owningInstitutionId","type":["null","string"]},{"name":"processed","type":"boolean"},{"name":"success","type":"boolean"},{"name":"createdDate","type":["null","string"]},{"name":"updatedDate","type":["null","string"]}]}';
record = {id: 716, jobId: '9a6fbbe9-bd10-4067-9fea-a0838de6c527', trackingId: '715', patronBarcode: '23333090797927', itemBarcode: "33433038947945", owningInstitutionId: 'NYPL', processed: false, success: false, createdDate: '2017-10-04T16:41:53-04:00', updatedDate: null}
let avroType = avro.parse(schema);
let buf = avroType.toBuffer(record);
console.log(buf.toString('base64'));
