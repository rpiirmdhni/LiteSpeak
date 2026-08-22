const getTimestamp = () => {
  const d = new Date();
  return d.getFullYear() + '-' + 
    String(d.getMonth() + 1).padStart(2, '0') + '-' + 
    String(d.getDate()).padStart(2, '0') + ' ' + 
    String(d.getHours()).padStart(2, '0') + ':' + 
    String(d.getMinutes()).padStart(2, '0') + ':' + 
    String(d.getSeconds()).padStart(2, '0');
};

const logger = {
  info: (service, message) => {
    console.log(`[${getTimestamp()}][${service}] ${message}`);
  },
  error: (service, message) => {
    console.error(`[${getTimestamp()}][${service}] ${message}`);
  }
};

module.exports = logger;
