// Variáveis globais
let servos = JSON.parse(localStorage.getItem('servos')) || [];
let currentFileData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderServos();
    updateStats();
});

// Configurar event listeners
function setupEventListeners() {
    const form = document.getElementById('cadastroForm');
    const fileInput = document.getElementById('documento');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const searchInput = document.getElementById('searchInput');

    // Formulário
    form.addEventListener('submit', handleFormSubmit);

    // Upload de arquivo
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);

    // Busca
    searchInput.addEventListener('input', handleSearch);

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });

    // ESC para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });
}

// Inicializar aplicação
function initializeApp() {
    // Verificar se há dados salvos
    if (servos.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
    } else {
        document.getElementById('emptyState').style.display = 'none';
    }
}

// Manipular envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
        const formData = new FormData(e.target);
        const servo = {
            id: Date.now(),
            nome: formData.get('nome').trim(),
            email: formData.get('email').trim().toLowerCase(),
            dataNascimento: formData.get('dataNascimento'),
            documento: currentFileData,
            dataCadastro: new Date().toISOString(),
            idade: calcularIdade(formData.get('dataNascimento'))
        };

        // Verificar se email já existe
        if (servos.some(s => s.email === servo.email)) {
            showError('email', 'Este email já está cadastrado');
            return;
        }

        servos.push(servo);
        saveToLocalStorage();
        renderServos();
        updateStats();
        limparFormulario();
        showSuccessMessage('Servo cadastrado com sucesso!');
    }
}

// Validar formulário
function validateForm() {
    let isValid = true;
    clearErrors();

    // Validar nome
    const nome = document.getElementById('nome').value.trim();
    if (nome.length < 2) {
        showError('nome', 'Nome deve ter pelo menos 2 caracteres');
        isValid = false;
    }

    // Validar email
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Email inválido');
        isValid = false;
    }

    // Validar data de nascimento
    const dataNascimento = document.getElementById('dataNascimento').value;
    if (!dataNascimento) {
        showError('data', 'Data de nascimento é obrigatória');
        isValid = false;
    } else {
        const idade = calcularIdade(dataNascimento);
        if (idade < 16) {
            showError('data', 'Servo deve ter pelo menos 16 anos');
            isValid = false;
        } else if (idade > 100) {
            showError('data', 'Data de nascimento inválida');
            isValid = false;
        }
    }

    // Validar documento
    if (!currentFileData) {
        showError('documento', 'Documento é obrigatório');
        isValid = false;
    }

    return isValid;
}

// Manipular seleção de arquivo
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Manipular drag over
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

// Manipular drag leave
function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

// Manipular drop de arquivo
function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Processar arquivo
function processFile(file) {
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showError('documento', 'Formato de arquivo não suportado. Use PDF, JPG, JPEG ou PNG');
        return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('documento', 'Arquivo muito grande. Máximo 5MB');
        return;
    }

    // Ler arquivo
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result
        };
        showFilePreview(currentFileData);
        clearError('documento');
    };
    reader.readAsDataURL(file);
}

// Mostrar preview do arquivo
function showFilePreview(fileData) {
    const preview = document.getElementById('filePreview');
    const icon = getFileIcon(fileData.type);
    const size = formatFileSize(fileData.size);
    
    preview.innerHTML = `
        <div class="file-info">
            <i class="${icon}"></i>
            <div class="file-details">
                <h4>${fileData.name}</h4>
                <p>${size}</p>
            </div>
        </div>
    `;
    preview.classList.add('show');
}

// Obter ícone do arquivo
function getFileIcon(type) {
    if (type === 'application/pdf') {
        return 'fas fa-file-pdf';
    } else if (type.startsWith('image/')) {
        return 'fas fa-file-image';
    }
    return 'fas fa-file';
}

// Formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Calcular idade
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

// Renderizar lista de servos
function renderServos(filteredServos = null) {
    const tbody = document.getElementById('servosTableBody');
    const emptyState = document.getElementById('emptyState');
    const servosToRender = filteredServos || servos;

    if (servosToRender.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    tbody.innerHTML = servosToRender.map(servo => `
        <tr>
            <td>${servo.nome}</td>
            <td>${servo.email}</td>
            <td>${formatDate(servo.dataNascimento)}</td>
            <td>${servo.idade} anos</td>
            <td>
                <span class="document-status ok">
                    <i class="fas fa-check-circle"></i>
                    Anexado
                </span>
            </td>
            <td>${formatDateTime(servo.dataCadastro)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-view" onclick="visualizarDocumento(${servo.id})" title="Visualizar documento">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="confirmarExclusao(${servo.id})" title="Excluir cadastro">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Buscar servos
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderServos();
        return;
    }

    const filtered = servos.filter(servo => 
        servo.nome.toLowerCase().includes(searchTerm) ||
        servo.email.toLowerCase().includes(searchTerm)
    );
    
    renderServos(filtered);
}

// Atualizar estatísticas
function updateStats() {
    document.getElementById('totalServos').textContent = servos.length;
    document.getElementById('documentosOk').textContent = servos.length;
}

// Visualizar documento
function visualizarDocumento(id) {
    const servo = servos.find(s => s.id === id);
    if (!servo || !servo.documento) return;

    const modal = document.getElementById('documentModal');
    const modalBody = document.getElementById('modalBody');
    
    if (servo.documento.type === 'application/pdf') {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h4>${servo.documento.name}</h4>
                <p>Tamanho: ${formatFileSize(servo.documento.size)}</p>
                <iframe src="${servo.documento.data}" width="100%" height="500px" style="border: none; border-radius: 8px;"></iframe>
                <div style="margin-top: 15px;">
                    <a href="${servo.documento.data}" download="${servo.documento.name}" class="btn-primary" style="text-decoration: none;">
                        <i class="fas fa-download"></i>
                        Baixar PDF
                    </a>
                </div>
            </div>
        `;
    } else if (servo.documento.type.startsWith('image/')) {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h4>${servo.documento.name}</h4>
                <p>Tamanho: ${formatFileSize(servo.documento.size)}</p>
                <img src="${servo.documento.data}" alt="Documento" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="margin-top: 15px;">
                    <a href="${servo.documento.data}" download="${servo.documento.name}" class="btn-primary" style="text-decoration: none;">
                        <i class="fas fa-download"></i>
                        Baixar Imagem
                    </a>
                </div>
            </div>
        `;
    }
    
    modal.classList.add('show');
}

// Confirmar exclusão
function confirmarExclusao(id) {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmDelete');
    
    confirmBtn.onclick = function() {
        excluirServo(id);
        fecharModal();
    };
    
    modal.classList.add('show');
}

// Excluir servo
function excluirServo(id) {
    servos = servos.filter(s => s.id !== id);
    saveToLocalStorage();
    renderServos();
    updateStats();
    showSuccessMessage('Cadastro excluído com sucesso!');
}

// Fechar modal
function fecharModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('show'));
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('cadastroForm').reset();
    document.getElementById('filePreview').classList.remove('show');
    currentFileData = null;
    clearErrors();
}

// Mostrar erro
function showError(field, message) {
    const errorElement = document.getElementById(field + '-error');
    const inputElement = document.getElementById(field === 'data' ? 'dataNascimento' : field);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

// Limpar erro específico
function clearError(field) {
    const errorElement = document.getElementById(field + '-error');
    const inputElement = document.getElementById(field === 'data' ? 'dataNascimento' : field);
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

// Limpar todos os erros
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.error');
    
    errorElements.forEach(el => el.textContent = '');
    inputElements.forEach(el => el.classList.remove('error'));
}

// Mostrar mensagem de sucesso
function showSuccessMessage(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Salvar no localStorage
function saveToLocalStorage() {
    localStorage.setItem('servos', JSON.stringify(servos));
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Formatar data e hora
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Exportar dados (função adicional)
function exportarDados() {
    const dataStr = JSON.stringify(servos, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `servos_kids_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Importar dados (função adicional)
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                servos = importedData;
                saveToLocalStorage();
                renderServos();
                updateStats();
                showSuccessMessage('Dados importados com sucesso!');
            } else {
                alert('Formato de arquivo inválido');
            }
        } catch (error) {
            alert('Erro ao importar dados: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);