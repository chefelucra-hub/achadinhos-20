# Controle de acesso

O arquivo público é somente leitura: não possui painel, formulário de cadastro, edição ou exclusão.

Para administração real na internet, o painel privado deverá usar Supabase Auth e políticas RLS. Somente o usuário proprietário terá permissão de inserir, atualizar ou excluir produtos. Visitantes terão somente permissão de leitura dos produtos ativos.
