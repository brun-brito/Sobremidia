// ativa hamburguer menu lateral
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('header nav ul');

    // Abre ou fecha o menu ao clicar no botão de toggle
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('showing');
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            menu.classList.remove('showing');
        }
    });
});

// Fecha o menu ao selecionar alguma seção
document.querySelectorAll('header nav ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('header nav ul').classList.remove('showing');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    switchToRegister.addEventListener('click', () => {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    switchToLogin.addEventListener('click', () => {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    document.getElementById('forgot-password-link').addEventListener('click', async function (e) {
        e.preventDefault();
    
        const email = document.getElementById('login-email').value;
    
        if (!email) {
            alert('Por favor, insira seu email para recuperar a senha.');
            return;
        }
    
        await auth.sendPasswordResetEmail(email)
            .then(() => {
                alert(`Um link para redefinir sua senha foi enviado para o email '${email}'. Confira sua caixa de entrada ou Spam/ Lixo Eletrônico`);
            })
            .catch((error) => {
                console.error('Erro ao enviar email de redefinição de senha:', error);
                alert('Ocorreu um erro ao tentar enviar o email de redefinição de senha. Verifique se o email está correto.');
            });
    });    

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const email = document.getElementById('register-email').value;
        const confirmEmail = document.getElementById('confirm-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const razaoSocial = document.getElementById('register-razao').value; 
        const cnpj = document.getElementById('register-cnpj').value.trim(); 
        const botaoVerifica = document.getElementById('verify-cnpj-button').innerText; 
    
        if (razaoSocial === '') {
            handleValidationError(`Por favor, clique no botão '${botaoVerifica}' ao lado do campo para validar.`, 'register');            return;
        }

        if (email !== confirmEmail) {
            handleValidationError('Os emails não correspondem.', 'register');
            return;
        }
    
        if (password !== confirmPassword) {
            handleValidationError('As senhas não correspondem.', 'register');
            return;
        }
        
        showLoading('register-button', 'register-loading');
        
        const cnpjValido = await validaCnpj(cnpj);
        if (!cnpjValido) {
            handleValidationError('O CNPJ informado não foi identificado como um cliente. Por favor, entre em contato para mais informações.', 'register');
            hideLoading('register-button', 'register-loading');
            return;
        }
        
        const cnpjExists = await cnpjRepetido(cnpj);
        if (cnpjExists) {
            handleValidationError('O CNPJ informado já foi cadastrado em nosso sistema, e pertence a outro usuário.', 'register');
            hideLoading('register-button', 'register-loading');
            return false;
        }
    
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // atribuindo a razao social ao nome do usuario
            await userCredential.updateProfile({
                displayName: razaoSocial
            });
            // add no firestore
            const doc = `${cnpj}-${razaoSocial}`;
            await db.collection("usuarios").doc(doc).set({
                razao_social: razaoSocial,
                cnpj: cnpj,
                email: email,
            });
            
            alert(`Cadastro de '${userCredential.email}' bem-sucedido! Por favor, faça login.`);
            registerForm.reset();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        } catch (error) {
            handleAuthError(error, 'register');
            hideLoading('register-button', 'register-loading');
        } finally {
            hideLoading('register-button', 'register-loading');
        }
    });
    
    async function cnpjRepetido(cnpj) {
        try {
            const querySnapshot = await db.collection('usuarios').where('cnpj', '==', cnpj).get();
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar cnpj: ", error);
            return false;
        }
    }

    async function validaCnpj(cnpj) {
        try{
            const response = await fetch('https://api.4yousee.com.br/v1/medias/categories', {
                headers: { 'Secret-Token': '67c7c2b91bcb315098bb733c07ce8b90' }
            });
            const data = await response.json();
            
            const categoriaExistente = data.results.find(category => {
                const [categoriaCNPJ] = category.name.split('-');
                return categoriaCNPJ === cnpj;
            });
    
            return !!categoriaExistente; // Retorna true se encontrar o CNPJ, false caso contrário
        } catch (error) {
            console.error('Erro ao validar CNPJ:', error);
            return false; // Trate como CNPJ não encontrado em caso de erro
        }
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });

    async function login() {
        const buttonId = "login-button";
        const loadingId = "login-loading";

        showLoading(buttonId, loadingId);

        try {
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            await auth.signInWithEmailAndPassword(email, password);

            window.location.href = "profile.html";
        } catch (error) {
            handleAuthError(error, 'login');
            hideLoading(buttonId, loadingId);
        }

        return false;
    }

    function showLoading(buttonId, loadingId) {
        const button = document.getElementById(buttonId);
        const loading = document.getElementById(loadingId);
        button.style.display = "none";
        loading.style.display = "block";
    }

    function hideLoading(buttonId, loadingId) {
        const button = document.getElementById(buttonId);
        const loading = document.getElementById(loadingId);
        button.style.display = "block";
        loading.style.display = "none";
    }

    function handleValidationError(message, context) {
        const errorMessageElement = document.getElementById(`${context}-error`);
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = "block";
    }

    function handleAuthError(error, context) {
        let errorMessage = "Ocorreu um erro desconhecido. Tente novamente.";

        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "O email fornecido é inválido.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "A senha está incorreta. Tente novamente.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "Nenhum usuário encontrado com este email.";
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = "Este email já está em uso por outra conta.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "A senha é muito fraca. Escolha uma senha mais forte.";
                    break;
                case 'auth/credential-already-in-use':
                    errorMessage = "Estas credenciais já estão associadas a outra conta.";
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "Esta operação não é permitida. Verifique as configurações.";
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = "Requer um login recente. Faça login novamente.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "A conta do usuário foi desativada por um administrador.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Erro de rede. Verifique sua conexão e tente novamente.";
                    break;
                case 'auth/internal-error':
                    if (error.message && error.message.includes("INVALID_LOGIN_CREDENTIALS")) {
                        errorMessage = "Email e/ou senha incorretos. Tente novamente.";
                    } else {
                        errorMessage = "Ocorreu um erro interno. Tente novamente.";
                    }
                    break;
                case 'auth/invalid-phone-number':
                    errorMessage = "O número de telefone fornecido é inválido.";
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = "O popup foi fechado antes da finalização do login. Tente novamente.";
                    break;
                case 'auth/invalid-verification-code':
                    errorMessage = "O código de verificação é inválido.";
                    break;
                default:
                    console.warn(`Erro interno: ${error.code} - ${error.message}`);
                    return;
            }
        }

        const errorMessageElement = document.getElementById(`${context}-error`);
        errorMessageElement.textContent = errorMessage;
        errorMessageElement.style.display = "block";
    }

    // const googleLoginButton = document.getElementById('google-login');
    // googleLoginButton.addEventListener('click', async () => {
    //     const provider = new firebase.auth.GoogleAuthProvider();

    //     try {
    //         const result = await auth.signInWithPopup(provider);
    //         console.log('Usuário logado com Google:', result.email);
    //         window.location.href = 'profile.html';
    //     } catch (error) {
    //         handleAuthError(error, 'login');
    //     }
    // });

    document.getElementById('verify-cnpj-button').addEventListener('click', async function() {
        const cnpj = document.getElementById('register-cnpj').value;
        const cnpjElement = document.getElementById('register-cnpj');
        const loadingElement = document.getElementById('verify-loading');
        const buttonElement = document.getElementById('verify-cnpj-button');
    
        if (cnpj.length !== 14) {
            alert('O CNPJ deve conter 14 números.');
            return;
        }
    
        loadingElement.style.display = 'inline';
        const url = `https://open.cnpja.com/office/${cnpj}`;
        const headers = {
            'Authorization': '0cdf6d17-8007-4769-a2fd-7e374d40f198-d718a448-1ce5-44a1-949a-201730bee40c'
        };
    
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('CNPJ não encontrado. Tente novamente!');
            
            const data = await response.json();
            const companyName = data.company && data.company.name ? data.company.name : 'Razão Social não encontrada';
            document.getElementById('register-razao').value = companyName;
            document.getElementById('register-razao').style.filter = 'none';
            
            buttonElement.disabled = true;
            buttonElement.style.backgroundColor = '#b2b2b2'; 
            buttonElement.style.pointerEvents = 'none'; 
            
            cnpjElement.disabled = true;
            cnpjElement.style.backgroundColor = '#f0f0f0';
            cnpjElement.style.pointerEvents = 'none'; 
        } catch (error) {
            alert('Erro ao verificar CNPJ: ' + error.message);
            document.getElementById('register-razao').value = '';
        } finally {
            document.getElementById('verify-loading').style.display = 'none';
        }
    });
});

function togglePasswordVisibility(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const eyeIcon = passwordField.nextElementSibling;
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

