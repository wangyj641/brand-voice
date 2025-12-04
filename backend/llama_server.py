from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

MODEL_NAME = "meta-llama/Llama-2-7b-hf"
device = "cpu"  # 普通台式机

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="auto",
    low_cpu_mem_usage=True
)
print("Model loaded!")

class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(request: PromptRequest):
    inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            do_sample=True,
            temperature=0.7
        )
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"result": text}

# 启动：
# uvicorn llama_server:app --reload --host 0.0.0.0 --port 8000
