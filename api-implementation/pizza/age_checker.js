"use strict"

module.exports = {

    metadata: () => ({
        "name": "AgeChecker",
        "properties": {
            "minAge": { "type": "integer", "required": true }
        },
        "supportedActions": [
            "allow",
            "block"
        ]
    }),

    invoke: (conversation, done) => {
        // Parse a number out of the incoming message
        const text = conversation.text();
        var age = 0;
        if (text){
          const matches = text.match(/\d+/);
          if (matches) {
              age = matches[0];
          }
        } else {
          var errText = "No age input provided";
          conversation.logger().error(errText);
          done(new Error(errText));
          return;
        }

        conversation.logger().info('AgeChecker: using age=' + age);

        // Set action based on age check
        let minAge = conversation.properties().minAge || 18;
        conversation.transition( age >= minAge ? 'allow' : 'block' );

        done();
    }
};
