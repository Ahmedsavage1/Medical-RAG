def run_retrieval(controller, questions: list, k: int = 5):
    results = []

    for question in questions:
        retrieved = controller.vectordb.search_with_scores(question, k=k)

        question_result = {
            "question": question,
            "k": k,
            "retrieved_chunks": []
        }

        for doc, score in retrieved:
            m = doc.metadata
            question_result["retrieved_chunks"].append({
                "chunk_text": doc.page_content,
                "score": round(score, 4),
                "document_id": m.get("document_id"),
                "page": m.get("page_number"),
                "chunk_id": m.get("chunk_id"),
            })

        results.append(question_result)

    return results
