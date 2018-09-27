/**
 * The ExpressJS namespace.
 * @external ExpressApplicationObject
 * @see {@link http://expressjs.com/4x/api.html#app}
 */


// IMPORTANT: Please customize apiURL it for you needs.
// apiURL is the OMCe API URL which implements the custom component service GET, mostly likely in the format ‘/mobile/custom/[API_NAME]/components’
const apiURL = '/mobile/custom/bots_samples/components';

// Reference component shell
var shell = require('./shell')();

/**
 * Mobile Cloud custom code service entry point.
 * @param {external:ExpressApplicationObject}
 * service
 */
module.exports = function(service) {

  /**
   * Retrieves metadata for components implemented by this service.
   */
  service.get(apiURL, function(req,res) {
    res.set('Content-Type', 'application/json')
       .status(200)
       .json(shell.getAllComponentMetadata());
  });

  /**
   * Invoke the named component
   */
  service.post(apiURL+'/:componentName', function(req,res) {
    const sdkMixin = { oracleMobile: req.oracleMobile };
    shell.invokeComponentByName(req.params.componentName, req.body, sdkMixin, function(err, data) {
        if (!err) {
            res.status(200).json(data);
        }
        else {
            switch (err.name) {
                case 'unknownComponent':
                    res.status(404).send(err.message);
                    break;
                case 'badRequest':
                    res.status(400).json(err.message);
                    break;
                default:
                    res.status(500).json(err.message);
                    break;
            }
        }
    });
  });
};
