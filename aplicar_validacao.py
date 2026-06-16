#!/usr/bin/env python3
import os, re, sys, shutil, difflib

SERVER_PATH = 'server/index.js'
FRONTEND_PATH = 'src/screens/HomeScreen.js'

VAL_ALT = """    // Validação: só permitir alterar se estiver Pendente
    const statusAtual = await executeQuery('SELECT STATUS FROM GARANTIAS_APP WHERE ID = ?', [id]);
    if (statusAtual.length === 0) {
      return res.status(404).json({ success: false, error: 'Garantia n\u00e3o encontrada' });
    }
    if (statusAtual[0].STATUS?.toLowerCase() !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Apenas garantias com status Pendente podem ser alteradas' });
    }
"""

VAL_EXC = """    // Validação: só permitir excluir se estiver Pendente
    const statusAtual = await executeQuery('SELECT STATUS FROM GARANTIAS_APP WHERE ID = ?', [id]);
    if (statusAtual.length === 0) {
      return res.status(404).json({ success: false, error: 'Garantia n\u00e3o encontrada' });
    }
    if (statusAtual[0].STATUS?.toLowerCase() !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Apenas garantias com status Pendente podem ser excluídas' });
    }
"""

def info(m): print(f"[INFO] {m}")
def erro(m): print(f"[ERRO] {m}"); sys.exit(1)

def encontra_rota(linhas, padrao):
    for i in range(len(linhas)):
        if re.search(padrao, linhas[i], re.I):
            depth = 0
            for j in range(i, len(linhas)):
                depth += linhas[j].count('{') - linhas[j].count('}')
                if j > i and depth == 0: return i, j
    erro(f"Rota n\u00e3o encontrada: {padrao}")

def insere(linhas, padrao_rota, val, padroes_sql, nome):
    info(f"Localizando rota {nome}...")
    inicio, fim = encontra_rota(linhas, padrao_rota)
    info(f"Rota {nome}: linhas {inicio+1}-{fim+1}")
    for i in range(inicio, min(fim+1, len(linhas))):
        if "Valida\u00e7\u00e3o:" in linhas[i] and nome in linhas[i]:
            info(f"J\u00e1 existe. Pulando.")
            return linhas
    for i in range(inicio, min(fim+1, len(linhas))):
        for p in padroes_sql:
            if re.search(p, linhas[i], re.I):
                info(f"Inserindo antes da linha {i+1}")
                linhas.insert(i, val)
                return linhas
    erro(f"Padr\u00e3o SQL n\u00e3o encontrado em {nome}")

def main():
    info("Iniciando...")
    for f in [SERVER_PATH, FRONTEND_PATH]:
        if not os.path.exists(f): erro(f"{f} n\u00e3o encontrado")

    shutil.copy2(SERVER_PATH, SERVER_PATH + '.bak')
    info(f"Backup: {SERVER_PATH}.bak")

    c = open(SERVER_PATH).read()
    l = c.splitlines(True)

    l = insere(l, r"app\.post\s*\(\s*['\"/]*(?:api/garantias/)?alterar['\"]",
               VAL_ALT, [r"SELECT\s+.*IMAGEM", r"WHERE\s+ID\s*=\s*\?", r"UPDATE\s+GARANTIAS_APP"], "alterar")

    l = insere(l, r"app\.post\s*\(\s*['\"/]*(?:api/garantias/)?excluir['\"]",
               VAL_EXC, [r"DELETE\s+FROM", r"WHERE\s+ID\s*=\s*\?"], "excluir")

    open(SERVER_PATH, 'w').write(''.join(l))
    info("server/index.js atualizado!")

    # FRONTEND
    shutil.copy2(FRONTEND_PATH, FRONTEND_PATH + '.bak')
    info(f"Backup: {FRONTEND_PATH}.bak")
    cf = open(FRONTEND_PATH).read()
    lf = cf.splitlines(True)

    achou = False
    for i in range(len(lf)):
        if 'Modal' in lf[i]:
            for j in range(i, min(i+60, len(lf))):
                if re.search(r'(?:Editar|Excluir|excluirGarantia)', lf[j]):
                    indent = re.match(r"\s*", lf[j]).group(0)
                    novo = f'''{indent}{{selectedGarantia?.STATUS?.toLowerCase() === 'pendente' ? (
{indent}  <View style={{{{flexDirection: 'row', justifyContent: 'space-around', marginTop: 10}}}}>
{indent}    <TouchableOpacity onPress={{() => {{ editarGarantia(selectedGarantia); setSelectedGarantia(null); }}}} style={{{{backgroundColor: '#0047AB', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6}}}}>
{indent}      <Text style={{{{color: '#fff', fontWeight: 'bold'}}}}>Editar</Text>
{indent}    </TouchableOpacity>
{indent}    <TouchableOpacity onPress={{() => {{ excluirGarantia(selectedGarantia); setSelectedGarantia(null); }}}} style={{{{backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6}}}}>
{indent}      <Text style={{{{color: '#fff', fontWeight: 'bold'}}}}>Excluir</Text>
{indent}    </TouchableOpacity>
{indent}  </View>
{indent}) : (
{indent}  <Text style={{{{textAlign: 'center', color: '#6B7280', marginVertical: 10, fontStyle: 'italic'}}}}>
{indent}    Garantia {{selectedGarantia.STATUS}} n\u00e3o pode ser alterada ou exclu\u00edda
{indent}  </Text>
{indent})}}
'''
                    # Acha o fechamento
                    for k in range(j, min(j+15, len(lf))):
                        if 'Cancelar' in lf[k] or 'setSelectedGarantia(null)' in lf[k] or 'setModalVisible(false)' in lf[k]:
                            for k2 in range(k, max(j, k-3)-1, -1):
                                if '</View>' in lf[k2]:
                                    lf[j:k2+1] = [novo]
                                    achou = True
                                    break
                            if achou: break
                    if achou: break
            if achou: break

    if achou:
        open(FRONTEND_PATH, 'w').write(''.join(lf))
        info("HomeScreen.js atualizado!")
    else:
        info("AVISO: N\u00e3o substituiu automaticamente. Verifique o modal manualmente.")

    # DIFF
    nc = open(SERVER_PATH).read()
    print(f"\n{'='*60}\nDIFF server/index.js\n{'='*60}")
    sys.stdout.writelines(difflib.unified_diff(c.splitlines(True), nc.splitlines(True), fromfile='original', tofile='modificado'))
    if achou:
        nf = open(FRONTEND_PATH).read()
        print(f"\n{'='*60}\nDIFF HomeScreen.js\n{'='*60}")
        sys.stdout.writelines(difflib.unified_diff(cf.splitlines(True), nf.splitlines(True), fromfile='original', tofile='modificado'))

    info("Conclu\u00eddo! Backups: .bak. Para desfazer: git checkout -- .")

if __name__ == '__main__':
    main()
