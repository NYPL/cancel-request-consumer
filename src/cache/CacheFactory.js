import CancelRequestConsumerError from '../helpers/ErrorHelper';
import logger from '../helpers/Logger';

const Cache = {
  token: null,
  nodeEnv: process.env.NODE_ENV,
  getToken() {
    return this.token;
  },
  setToken(token) {
    this.token = token;
  },
  getNodeEnv() {
    return this.nodeEnv;
  },
  setNodeEnv(env) {
    this.nodeEnv = env;
  },
  isProductionEnv() {
    return this.nodeEnv === 'production';
  },
  filterProcessedRecords(records) {
    let filteredRecords = [];

    if (records && Array.isArray(records) && records.length > 0) {
      logger.info('Filtering out decoded records with a processed flag equal to true; may result in an empty array');

      filteredRecords = records.filter(record => {
        if (record.processed) {
          logger.info(`Filtered out Cancel Request Record (${record.id}); contains the proccessed flag set as true and has been removed from the records array for further processing`);
        }

        return !record.processed;
      });

      logger.info(`Total records decoded: ${records.length}; Total records to process: ${filteredRecords.length}`);
    }

    // return filteredRecords;
    if (filteredRecords.length === 0) {
      return Promise.reject(
        new CancelRequestConsumerError(
          'the Cancel Request Records have been filtered resulting in an empty array; no records remain to be processed',
          { type: 'filtered-records-array-empty' }
        )
      );
    }

    return Promise.resolve(filteredRecords);
  }
};

export default Cache;
