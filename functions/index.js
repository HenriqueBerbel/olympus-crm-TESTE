// Arquivo: functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function para deletar um usuário completamente.
 * Esta função é "chamável", ou seja, nosso app React pode invocá-la.
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // 1. Verificação de Segurança: A chamada foi feita por um usuário logado?
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Ação não permitida. Você precisa estar autenticado.",
    );
  }

  const callerUid = context.auth.uid; // ID de quem está chamando a função (o admin)
  const userIdToDelete = data.uid; // ID de quem deve ser deletado (passado pelo app)

  // 2. Verificação de Permissão: O usuário que está chamando tem permissão para deletar?
  const callerDoc = await admin.firestore().collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().permissions?.managePermissions !== true) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Você não tem permissão para executar esta ação.",
    );
  }

  if (!userIdToDelete) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "O ID do usuário a ser deletado não foi fornecido.",
    );
  }

  try {
    // 3. Execução: Se passou nas verificações, deleta o usuário de verdade.
    console.log(`Admin ${callerUid} está tentando deletar usuário ${userIdToDelete}`);

    // Deleta do Firebase Authentication (a parte do login)
    await admin.auth().deleteUser(userIdToDelete);

    // Deleta o documento do usuário do Firestore (a parte dos dados)
    await admin.firestore().collection("users").doc(userIdToDelete).delete();

    console.log(`Usuário ${userIdToDelete} deletado com sucesso.`);
    return {success: true, message: "Usuário deletado com sucesso."};
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Ocorreu um erro interno ao tentar deletar o usuário.",
        error.message,
    );
  }
});
