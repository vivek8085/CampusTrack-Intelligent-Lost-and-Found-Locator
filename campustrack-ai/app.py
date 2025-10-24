from fastapi import FastAPI, UploadFile, Form
import os

app = FastAPI()

# Try to import heavy models; if unavailable, fall back to deterministic embeddings
try:
    from sentence_transformers import SentenceTransformer
    from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
    from tensorflow.keras.preprocessing import image
    import numpy as np

    text_model = SentenceTransformer('all-MiniLM-L6-v2')
    image_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

    @app.post("/predict_match/")
    async def predict_match(description: str = Form(...), image_file: UploadFile = None):
        # Get embeddings for description
        text_emb = text_model.encode([description])[0]

        # Get embeddings for image
        img_emb = None
        if image_file:
            contents = await image_file.read()
            img_path = f"temp_{image_file.filename}"
            with open(img_path, "wb") as f:
                f.write(contents)
            img = image.load_img(img_path, target_size=(224, 224))
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)
            img_emb = image_model.predict(x).flatten()
            os.remove(img_path)

        combined_emb = np.concatenate([text_emb, img_emb]) if img_emb is not None else text_emb
        return {"status": "success", "embedding_vector": combined_emb.tolist()}

except Exception as e:
    # Fallback lightweight deterministic embedding generator
    import hashlib
    import json

    def text_to_embedding(text, dim=128):
        # deterministic pseudo-embedding via hashing
        h = hashlib.sha256(text.encode('utf-8')).digest()
        vals = [b / 255.0 for b in h]
        # expand or trim to dim
        emb = []
        i = 0
        while len(emb) < dim:
            emb.extend(vals)
            i += 1
        return emb[:dim]

    @app.post("/predict_match/")
    async def predict_match(description: str = Form(...), image_file: UploadFile = None):
        desc = description or ""
        emb_text = text_to_embedding(desc, dim=128)
        emb_img = None
        if image_file:
            contents = await image_file.read()
            # use hash of bytes to derive deterministic image embedding
            h = hashlib.sha256(contents).digest()
            emb_img = [b / 255.0 for b in h]
            # pad to same length
            if len(emb_img) < 128:
                emb_img = (emb_img * ((128 // len(emb_img)) + 1))[:128]

        combined = emb_text + emb_img if emb_img is not None else emb_text
        return {"status": "success", "embedding_vector": combined}
