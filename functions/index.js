/**
 * =================================================================
 * ARQUIVO PRINCIPAL DE CLOUD FUNCTIONS - OLYMPUS CRM
 * VERSÃO FINAL COM LOGS ESTRUTURADOS
 * =================================================================
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();
const db = admin.firestore();

// =================================================================
// FUNÇÃO AUXILIAR (HELPER) COM LOGS ESTRUTURADOS
// =================================================================

const verifyTokenAndPermission = async (req, allowedRoles = []) => {
  // Usamos .debug() para logs detalhados que podem ser filtrados
  functions.logger.debug("--- Iniciando verificação de token e permissão ---");

  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    functions.logger.error("FALHA: Cabeçalho de autorização ausente ou mal formatado.");
    throw new functions.https.HttpsError("unauthenticated", "Cabeçalho de autorização ausente ou mal formatado.");
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    functions.logger.debug(`Token verificado com sucesso para o UID: ${uid}`);

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      functions.logger.error(`FALHA: Documento do usuário 'users/${uid}' não encontrado no Firestore.`);
      throw new functions.https.HttpsError("not-found", "Usuário não encontrado no Firestore.");
    }

    const userData = userDoc.data();
    const userRole = userData.roleId;
    
    // Log detalhado que só aparecerá se você filtrar por "Debug"
    functions.logger.debug("Dados do documento do usuário:", {uid, data: userData});

    if (!allowedRoles.includes(userRole)) {
      functions.logger.warn(`Permissão negada para o UID: ${uid} com cargo '${userRole}'.`); // Usamos .warn() para tentativas de acesso não autorizado
      throw new functions.https.HttpsError("permission-denied", `Permissão negada. O cargo '${userRole}' não é permitido.`);
    }

    functions.logger.info(`Permissão concedida para UID: ${uid}, Cargo: '${userRole}'.`); // Usamos .info() para um log limpo de sucesso
    return {uid, userData};
  } catch (error) {
    functions.logger.error("Erro crítico na verificação de token ou permissão:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Erro interno ao validar a permissão.");
  }
};

// =================================================================
// FUNÇÕES HTTP "onRequest"
// =================================================================

exports.createUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const permittedRoles = ["superadmin", "ceo", "gerente"];
      const {uid} = await verifyTokenAndPermission(req, permittedRoles);

      const {name, email, password, roleId} = req.body.data;
      if (!name || !email || !password || !roleId) {
        throw new functions.https.HttpsError("invalid-argument", "Dados incompletos.");
      }

      const userRecord = await admin.auth().createUser({email, password, displayName: name});

      await db.collection("users").doc(userRecord.uid).set({
        name, email, roleId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        permissionsOverrides: {},
      });
      
      functions.logger.info(`Usuário '${userRecord.uid}' criado com sucesso pelo admin '${uid}'.`);
      res.status(200).send({data: {success: true, uid: userRecord.uid}});
    } catch (error) {
      functions.logger.error("Erro em createUser:", error);
      const status = error.httpErrorCode?.status || 500;
      const message = error.message || "Ocorreu um erro inesperado.";
      res.status(status).send({error: {message}});
    }
  });
});

exports.deleteUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const permittedRoles = ["superadmin", "ceo"];
      const {uid: adminUid} = await verifyTokenAndPermission(req, permittedRoles);

      const {uid: userToDeleteUid} = req.body.data;
      if (!userToDeleteUid) {
        throw new functions.https.HttpsError("invalid-argument", "UID do usuário é obrigatório.");
      }

      await admin.auth().deleteUser(userToDeleteUid);
      await db.collection("users").doc(userToDeleteUid).delete();

      functions.logger.info(`Usuário '${userToDeleteUid}' excluído com sucesso pelo admin '${adminUid}'.`);
      res.status(200).send({data: {success: true}});
    } catch (error) {
      functions.logger.error("Erro em deleteUser:", error);
      const status = error.httpErrorCode?.status || 500;
      const message = error.message || "Ocorreu um erro inesperado.";
      res.status(status).send({error: {message}});
    }
  });
});