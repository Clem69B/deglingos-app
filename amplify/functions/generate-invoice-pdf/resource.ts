import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineFunction } from "@aws-amplify/backend";
import { Duration } from "aws-cdk-lib";
import { Code, Function, Runtime, LayerVersion } from "aws-cdk-lib/aws-lambda";

const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const generateInvoicePdf = defineFunction(
  (scope) => {
    const weasyprintLayer = new LayerVersion(scope, "weasyprintLayer", {
      code: Code.fromAsset(
        path.join(functionDir, "weasyprint-layer-python3.12-x86_64.zip")
      ),
      compatibleRuntimes: [Runtime.PYTHON_3_12],
      license: "MIT",
      description: "fonts and libs required by weasyprint",
    });

    const dependenciesLayer = new LayerVersion(scope, "dependenciesLayer", {
      code: Code.fromAsset(functionDir, {
        bundling: {
          image: Runtime.PYTHON_3_12.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output/python",
          ],
        },
      }),
      compatibleRuntimes: [Runtime.PYTHON_3_12],
      description: "Python dependencies from requirements.txt",
    });

    return new Function(scope, "generate-invoice-pdf", {
      handler: "index.handler",
      memorySize: 1024,
      runtime: Runtime.PYTHON_3_12,
      timeout: Duration.seconds(30),
      code: Code.fromAsset(path.join(functionDir, "script")),
      environment: {
        GDK_PIXBUF_MODULE_FILE: "/opt/lib/loaders.cache",
        FONTCONFIG_PATH: "/opt/fonts",
        XDG_DATA_DIRS: "/opt/lib",
      },
      layers: [weasyprintLayer, dependenciesLayer],
    });
  },
    {
      resourceGroupName: 'data',
    }
);