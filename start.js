const { spawn } = require("child_process");
const path = require("path");

function getListingId(url) {
  const match = url.match(/\/rooms\/(\d+)/);
  return match ? match[1] : "listing";
}

async function runCommand(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [script, ...args], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  const command = process.argv[2];
  const airbnbUrl = process.argv[3];
  const param3 = process.argv[4];
  const param4 = process.argv[5];

  if (!command || !airbnbUrl) {
    console.log(
      "Usage: node scrape_airbnb.js <command> <airbnb_url> [template|language] [language]"
    );
    console.log("");
    console.log("Commands:");
    console.log("  setup   - Create the file structure for the website");
    console.log(
      "  scrape  - Scrape the Airbnb listing and write data to listing.json"
    );
    console.log("  modify  - Modify index.html based on listing.json data");
    console.log("  all     - Run all three commands in sequence");
    console.log("");
    console.log("Examples:");
    console.log("  # Basic usage (default template, no languages)");
    console.log(
      "  node scrape_airbnb.js all https://www.airbnb.com/rooms/123456789"
    );
    console.log("");
    console.log("  # Default template with languages");
    console.log(
      "  node scrape_airbnb.js all https://www.airbnb.com/rooms/123456789 en,es,fr"
    );
    console.log("");
    console.log("  # Specific template with languages");
    console.log(
      "  node scrape_airbnb.js all https://www.airbnb.com/rooms/123456789 v1 en,es,fr"
    );
    console.log("");
    console.log("  # Individual commands");
    console.log(
      "  node scrape_airbnb.js setup https://www.airbnb.com/rooms/123456789 en,es,fr"
    );
    console.log(
      "  node scrape_airbnb.js scrape https://www.airbnb.com/rooms/123456789"
    );
    console.log(
      "  node scrape_airbnb.js modify https://www.airbnb.com/rooms/123456789"
    );
    process.exit(1);
  }

  // Validate Airbnb URL
  if (!/^https:\/\/www\.airbnb\.com\/rooms\/\d+/.test(airbnbUrl)) {
    console.error(
      "Error: Invalid Airbnb URL format. Must be: https://www.airbnb.com/rooms/123456789"
    );
    process.exit(1);
  }

  const listingId = getListingId(airbnbUrl);
  console.log(`Processing listing ID: ${listingId}`);
  let args = [airbnbUrl];
  try {
    switch (command) {
      case "setup":
        console.log("=== Running Setup ===");
        args = [airbnbUrl, param3, param4];
        await runCommand("setup.js", args.filter(Boolean));
        break;

      case "scrape":
        console.log("=== Running Scrape ===");
        args = [airbnbUrl];
        await runCommand("scrape.js", [airbnbUrl]);
        break;

      case "modify":
        console.log("=== Running Modify ===");
        args = [airbnbUrl];
        if (
          (param3 && typeof param3 === "string" && param3.includes(",")) ||
          (param4 && typeof param4 === "string" && param4.includes(","))
        ) {
          // Prefer param3 if both are comma-separated lists, else use whichever is present
          if (param3 && param3.includes(",")) {
            args.push(param3);
          } else if (param4 && param4.includes(",")) {
            args.push(param4);
          }
        }
        await runCommand("modify.js", args);
        break;

      case "all":
        console.log("=== Running All Commands ===");
        console.log("1. Setup...");
        await runCommand(
          "setup.js",
          [airbnbUrl, param3, param4].filter(Boolean)
        );

        console.log("2. Scrape...");
        await runCommand("scrape.js", [airbnbUrl]);

        console.log("3. Modify...");
        // Pass param3 or param4 to modify.js if either is a comma-separated list
        let modifyArgs = [airbnbUrl];
        if (
          (param3 && typeof param3 === "string" && param3.includes(",")) ||
          (param4 && typeof param4 === "string" && param4.includes(","))
        ) {
          // Prefer param3 if both are comma-separated lists, else use whichever is present
          if (param3 && param3.includes(",")) {
            modifyArgs.push(param3);
          } else if (param4 && param4.includes(",")) {
            modifyArgs.push(param4);
          }
        }
        await runCommand("modify.js", modifyArgs);

        console.log("4. Download images...");
        await runCommand("download-images.js", [airbnbUrl]);

        console.log("✅ All commands completed successfully!");
        console.log(
          `📁 Project created in: ${path.resolve("demo", listingId)}`
        );
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.log("Available commands: setup, scrape, modify, all");
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error running command '${command}':`, error.message);
    process.exit(1);
  }
}

main().catch(console.error);
