const natural = require("natural");
const { cosine } = require("ml-distance");

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

let documents = [];
let vectors = [];

/**
 * Charger toutes les destinations depuis la base
 */
async function loadSites(SiteModel) {
    const sites = await SiteModel.find();

    documents = sites.map(site => ({
        id: site._id.toString(),
        name: site.name,
        content: `${site.description} ${site.category} ${site.location}`
    }));

    documents.forEach(doc => {
        tfidf.addDocument(doc.content);
    });

    buildVectors();
}

/**
 * Construire vecteurs TF-IDF
 */
function buildVectors() {
    vectors = documents.map((doc, index) => {
        let vector = [];
        tfidf.listTerms(index).forEach(item => {
            vector.push(item.tfidf);
        });
        return vector;
    });
}

/**
 * Recommander sites similaires
 */
function recommend(siteId, topN = 5) {
    const index = documents.findIndex(doc => doc.id === siteId);
    if (index === -1) return [];

    const targetVector = vectors[index];

    const scores = vectors.map((vector, i) => {
        if (i === index) return null;

        return {
            id: documents[i].id,
            score: cosine(targetVector, vector)
        };
    });

    return scores
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}

module.exports = { loadSites, recommend };