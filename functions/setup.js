const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// ===================================================================
// 1. CONFIGURAÇÃO DO USUÁRIO MESTRE
// ===================================================================
const MASTER_USER_EMAIL = "henriquemfberbel@hotmail.com";
const MASTER_USER_NAME = "Henrique Berbel";
// ===================================================================

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * NOVA ESTRUTURA DE DADOS PARA PERMISSÕES DE CARGOS (ROLES)
 *
 * create: boolean - Permite ou não a criação.
 * view, edit, delete: object - Define o escopo da ação.
 * - scope: 'nenhum', 'próprio', 'todos'.
 * (O scope 'specificUsers' será definido apenas nas permissões individuais de cada usuário).
 */
const rolesData = {
  superadmin: {
    name: "SuperAdmin",
    permissions: {
      leads:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      clients:   { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      tasks:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      commissions:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      production:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      timeline:  { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
      corporate: { manageUsers: true, managePermissions: true, managePartners: true, manageOperators: true, manageCompanyProfile: true },
    },
  },
  ceo: {
    name: "CEO",
    permissions: {
        leads:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        clients:   { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        tasks:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        commissions:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        production:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        timeline:  { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'todos' } },
        corporate: { manageUsers: true, managePermissions: true, managePartners: true, manageOperators: true, manageCompanyProfile: true },
    },
  },
  gerente: {
    name: "Gerente",
    permissions: {
        leads:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'próprio' } },
        clients:   { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'próprio' } },
        tasks:     { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'próprio' } },
        commissions:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'nenhum' } },
        production:{ create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'nenhum' } },
        timeline:  { create: true, view: { scope: 'todos' }, edit: { scope: 'todos' }, delete: { scope: 'nenhum' } },
        corporate: { manageUsers: true, managePermissions: false, managePartners: true, manageOperators: true, manageCompanyProfile: false },
    },
  },
  administrativo: {
    name: "Administrativo",
    permissions: {
        leads:     { create: false, view: { scope: 'nenhum' }, edit: { scope: 'nenhum' }, delete: { scope: 'nenhum' } },
        clients:   { create: true,  view: { scope: 'todos' },  edit: { scope: 'todos' },  delete: { scope: 'próprio' } },
        tasks:     { create: true,  view: { scope: 'todos' },  edit: { scope: 'todos' },  delete: { scope: 'próprio' } },
        commissions:{ create: true,  view: { scope: 'todos' },  edit: { scope: 'todos' },  delete: { scope: 'nenhum' } },
        production:{ create: true,  view: { scope: 'todos' },  edit: { scope: 'todos' },  delete: { scope: 'nenhum' } },
        timeline:  { create: false, view: { scope: 'nenhum' }, edit: { scope: 'nenhum' }, delete: { scope: 'nenhum' } },
        corporate: { manageUsers: false, managePermissions: false, managePartners: false, manageOperators: false, manageCompanyProfile: false },
    },
  },
  supervisor: {
    name: "Supervisor",
    permissions: {
        leads:     { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        clients:   { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        tasks:     { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        commissions:{ create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        production:{ create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        timeline:  { create: false, view: { scope: 'nenhum' }, edit: { scope: 'nenhum' }, delete: { scope: 'nenhum' } },
        corporate: { manageUsers: false, managePermissions: false, managePartners: false, manageOperators: false, manageCompanyProfile: false },
    },
  },
  corretor: {
    name: "Corretor",
    permissions: {
        leads:     { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        clients:   { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        tasks:     { create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        commissions:{ create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        production:{ create: true, view: { scope: 'próprio' }, edit: { scope: 'próprio' }, delete: { scope: 'nenhum' } },
        timeline:  { create: false, view: { scope: 'nenhum' }, edit: { scope: 'nenhum' }, delete: { scope: 'nenhum' } },
        corporate: { manageUsers: false, managePermissions: false, managePartners: false, manageOperators: false, manageCompanyProfile: false },
    },
  },
};

async function setupDatabase() {
  console.log("--- INICIANDO SETUP COM A NOVA ESTRUTURA DE PERMISSÕES ---");

  console.log("\n[ETAPA 1/2] Reescrevendo a coleção \"roles\"...");
  const rolesCollection = db.collection("roles");
  const rolesBatch = db.batch();

  for (const roleId in rolesData) {
    if (Object.prototype.hasOwnProperty.call(rolesData, roleId)) {
      const roleData = rolesData[roleId];
      const docRef = rolesCollection.doc(roleId);
      rolesBatch.set(docRef, roleData);
      console.log(`- Cargo '${roleData.name}' preparado com a nova estrutura.`);
    }
  }
  await rolesBatch.commit();
  console.log(">>> Coleção \"roles\" reescrita com sucesso!");

  console.log(`\n[ETAPA 2/2] Configurando o usuário mestre: ${MASTER_USER_EMAIL}...`);
  try {
    const userRecord = await admin.auth().getUserByEmail(MASTER_USER_EMAIL);
    const uid = userRecord.uid;
    console.log(`- Usuário encontrado. UID: ${uid}`);

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.set({
      name: MASTER_USER_NAME,
      email: MASTER_USER_EMAIL,
      roleId: "superadmin",
      permissions: {}, // O objeto de permissões individuais começa vazio.
    }, { merge: true }); // Usamos merge para não apagar outros campos que possam existir

    console.log(">>> Documento do usuário mestre configurado com o cargo 'superadmin'.");
    console.log("\n--- SETUP CONCLUÍDO COM SUCESSO! ---");
    process.exit(0);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.error(`\nERRO FATAL: O usuário "${MASTER_USER_EMAIL}" não foi encontrado no Firebase Authentication.`);
      console.error("Por favor, crie este usuário no Console do Firebase antes de executar o script.");
    } else {
      console.error("Ocorreu um erro inesperado:", error);
    }
    process.exit(1);
  }
}

setupDatabase();