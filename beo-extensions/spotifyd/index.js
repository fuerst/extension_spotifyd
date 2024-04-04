// spotifyd CONTROL FOR BEOCREATE
const { updateAttribValueConfig, 
        getExtensionStatus, 
        setExtensionStatus,
        parseConfigFile } = 
 require(global.beo.extensionDirectory+'/hbosextensions/utilities');

const extensionName = "spotifyd"
const configFile = "/etc/spotifyd.conf"

spotifydconfig = {}
spotifydsettings = {}


var version = require("./package.json").version;

// Listen for general events
beo.bus.on('general', function(event) {
    // Handle system startup
    if (event.header == "startup") {
        // Check if the sources extension is available and set it up
        if (beo.extensions.sources &&
            beo.extensions.sources.setSourceOptions &&
            beo.extensions.sources.sourceDeactivated) {
            sources = beo.extensions.sources;
        }

        // Configure Spotify source options if sources are available
        if (sources) {
            getExtensionStatus(extensionName, function(enabled) {
                sources.setSourceOptions("spotifyd", {
                    enabled: enabled,
                    transportControls: true,
                    usesHifiberryControl: true,
                    aka: ["Spotify","spotifyd.instance1"]
                });
                spotifydsettings.spotifydEnabled = enabled
                beo.bus.emit("ui", {target: "spotifyd", header: "spotifydSettings", content: spotifydsettings})
            });
        }

        // Perform initial configuration reading
        spotifyconfig=parseConfigFile(configFile);
	if (spotifyconfig.global && 
		spotifyconfig.global.username && 
		!spotifyconfig.global.username.comment && 
		spotifyconfig.global.password && 
		!spotifyconfig.global.password.comment) {
		spotifydsettings.loggedInAs = spotifyconfig.global.username;
	} else {
		spotifydsettings.loggedInAs = false;
	}

        // Disable Spotify in the sources if no configuration is present
        if (sources && Object.keys(configuration).length === 0) {
            sources.setSourceOptions("spotifyd", {enabled: false})
        }
    }

    // Respond to activation of the Spotify extension
    if (event.header == "activatedExtension") {
        if (event.content.extension == "spotifyd") {
            // Notify the UI about the current Spotify settings
            console.log(spotifydsettings)
            beo.bus.emit("ui", {target: "spotifyd", header: "spotifydSettings", content: spotifydsettings})
        }
    }
});



// Listen for events related to Spotify
beo.bus.on('spotifyd', function(event) {
    if (event.header == "spotifydEnabled") {
        if (event.content.enabled !== undefined) {
            setExtensionStatus(extensionName, event.content.enabled, function(newStatus, error) {
                // Emit updated settings to UI
                beo.bus.emit("ui", {target: "spotifyd", header: "spotifydSettings", content: spotifydsettings});
                
                // Update source options based on new status
                if (sources) sources.setSourceOptions("spotifyd", {enabled: newStatus});
                
                // Handle deactivation
                if (newStatus === false) {
                    if (sources) sources.sourceDeactivated("spotifyd");
                }
                
                // Handle errors
                if (error) {
                    beo.bus.emit("ui", {target: "spotifyd", header: "errorTogglingSpotify", content: {}});
                }
            });
        }
    }
});


module.exports = {
	version: version,
};
