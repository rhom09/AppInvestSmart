import { RENDA_FIXA_MOCK } from '@/data/mockData'
import { formatData, formatMoeda } from '@/utils/formatters'
import { Shield, Lock } from 'lucide-react'

const riscoCor: Record<string, string> = {
    BAIXO: 'badge-green',
    MEDIO: 'badge-yellow',
    ALTO: 'badge-red',
}

export const RendaFixaPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Renda Fixa</h1>
                <p className="text-text-secondary text-sm mt-1">CDBs, LCIs, LCAs, Tesouro e mais</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {RENDA_FIXA_MOCK.map(rf => (
                    <div key={rf.id} className="card hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    {rf.tipo === 'TESOURO' ? <Shield size={20} className="text-primary" /> : <Lock size={20} className="text-primary" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="badge-blue text-[10px]">{rf.tipo}</span>
                                        <span className={`${riscoCor[rf.risco]} text-[10px]`}>Risco {rf.risco}</span>
                                    </div>
                                    <h3 className="font-bold text-text-primary">{rf.nome}</h3>
                                    <p className="text-xs text-text-muted">{rf.emissor} • Venc: {formatData(rf.vencimento)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-right">
                                <div>
                                    <p className="text-[11px] text-text-muted">Taxa</p>
                                    <p className="text-lg font-bold text-primary">
                                        {rf.indexador === 'CDI' || rf.indexador === 'SELIC' ? `${rf.taxa}%` : `${rf.indexador}+${rf.taxa}%`}
                                    </p>
                                    <p className="text-xs text-text-muted">{rf.indexador}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-text-muted">Mín.</p>
                                    <p className="text-sm font-semibold text-text-primary">{formatMoeda(rf.investimentoMinimo)}</p>
                                    <p className="text-xs text-text-muted">{rf.liquidez}</p>
                                </div>
                                <button className="btn-primary text-sm px-5">Investir</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
