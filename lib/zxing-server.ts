// Server-side ZXing setup. Cloudflare Workers can't compile WebAssembly from bytes at runtime,
// so the .wasm is imported as a precompiled module (OpenNext bundles it) and instantiated here.
import { prepareZXingModule } from "zxing-wasm/reader";
// Direct path: Turbopack does not resolve the package-exports alias with "?module".
import wasmModule from "../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm?module";

prepareZXingModule({
	overrides: {
		instantiateWasm(imports: WebAssembly.Imports, receive: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void) {
			WebAssembly.instantiate(wasmModule, imports).then((instance) => receive(instance, wasmModule));
			return {};
		},
	},
});
