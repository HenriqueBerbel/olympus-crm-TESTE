const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Lista de todas as coleções que a sua aplicação espera que existam.
const collectionsToCreate = [
  "clients",
  "leads",
  "tasks",
  "timeline",
  "operators",
  "commissions",
  "company_profile",
  "kanban_columns",
  "completed_events",
  "partners",
  "productions",
  "notifications",
  "users", // Adicionando users para garantir que a coleção exista
  "roles", // Adicionando roles para garantir que a coleção exista
];

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createInitialCollections() {
  console.log("--- INICIANDO A CRIAÇÃO DAS COLEÇÕES BÁSICAS ---");

  const batch = db.batch();

  collectionsToCreate.forEach((collectionName) => {
    // Criamos um documento placeholder chamado '_init' em cada coleção.
    // A existência de pelo menos um documento garante que a coleção exista.
    const docRef = db.collection(collectionName).doc("_init");
    batch.set(docRef, {initialized: true, createdAt: admin.firestore.FieldValue.serverTimestamp()});
    console.log(`- Coleção '${collectionName}' preparada para criação.`);
  });

  try {
    await batch.commit();
    console.log("\n>>> Todas as coleções foram criadas com sucesso no Firestore!");
    
    // [MELHORIA] Instruções claras sobre os próximos passos para o ACL funcionar
    console.log("\n==================== AÇÃO NECESSÁRIA PARA O ACL ====================");
    console.log("Para que as consultas de permissão (ACL) funcionem rapidamente, você precisa criar os seguintes ÍNDICES COMPOSTOS no seu painel do Firestore:");
    console.log("\nAcesse: Firebase Console -> Firestore Database -> Índices -> Criar Índice\n");

    console.log("1. ÍNDICE PARA CLIENTES:");
    console.log("   - Coleção: clients");
    console.log("   - Campos: ");
    console.log("     1. ownerId (Ascendente)");
    console.log("     2. general.companyName (Ascendente)");
    console.log("   - Escopo da consulta: Nível de coleção\n");
    
    console.log("2. ÍNDICE PARA TAREFAS:");
    console.log("   - Coleção: tasks");
    console.log("   - Campos: ");
    console.log("     1. ownerId (Ascendente)");
    console.log("     2. createdAt (Descendente)  <-- ou outro campo de ordenação que você usar");
    console.log("   - Escopo da consulta: Nível de coleção\n");

    console.log("3. ÍNDICE PARA LEADS:");
    console.log("   - Coleção: leads");
    console.log("   - Campos: ");
    console.log("     1. ownerId (Ascendente)");
    console.log("     2. lastActivityDate (Descendente) <-- ou outro campo de ordenação");
    console.log("   - Escopo da consulta: Nível de coleção\n");

    console.log("Repita o processo para outras coleções (Comissões, Produção) conforme necessário.");
    console.log("======================================================================\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\nERRO FATAL ao criar coleções:", error);
    process.exit(1);
  }
}

createInitialCollections();