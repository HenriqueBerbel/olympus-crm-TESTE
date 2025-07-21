const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createNewUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Apenas usuários autenticados podem criar novas contas."
    );
  }

  const { name, email, password } = data; // Apenas os campos básicos

  if (!name || !email || !password) {
     throw new functions.https.HttpsError(
      "invalid-argument",
      "Nome, email e senha são obrigatórios."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Para o MVP, todo novo usuário será criado como 'Admin' por padrão.
    // Isso garante que todos possam ver tudo por enquanto.
    const userProfile = {
      name: name,
      email: email,
      permissionLevel: 'Admin', // Nível de permissão fixo para o MVP
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("users").doc(userRecord.uid).set(userProfile);
    
    // Adiciona a permissão ao token do usuário
    await admin.auth().setCustomUserClaims(userRecord.uid, { permissionLevel: 'Admin' });

    return { success: true, uid: userRecord.uid };

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Este endereço de email já está em uso.');
    }
     if (error.code === 'auth/invalid-password') {
        throw new functions.https.HttpsError('invalid-argument', 'A senha deve ter no mínimo 6 caracteres.');
    }
    throw new functions.https.HttpsError('internal', 'Ocorreu um erro inesperado ao criar o usuário.');
  }
});