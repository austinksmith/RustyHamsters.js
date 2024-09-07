use wasm_bindgen::prelude::*;

// This extern block allows us to call a JavaScript function from Rust
#[wasm_bindgen]
extern "C" {
    // This is a JavaScript function we will call from Rust
    #[wasm_bindgen(js_namespace = globalThis)]
    fn eval_js_job(job_str: &str) -> JsValue;
}

// The Rust function that processes data but calls JS for dynamic code
#[wasm_bindgen]
pub fn process_data(hamsters_job: String, params: JsValue) -> JsValue {
    // Call the JavaScript job string using eval
    let result = eval_js_job(&hamsters_job);

    // Optionally, you can now process `result` further in Rust.
    result
}
