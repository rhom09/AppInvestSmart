/*
* Executar este script no SQL Editor do Supabase *
*/

-- Tabela de scores diários (Histórico)
CREATE TABLE IF NOT EXISTS public.scores_diarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker text NOT NULL,
    score integer NOT NULL,
    pl decimal,
    pvp decimal,
    dy decimal,
    roe decimal,
    preco decimal,
    data date DEFAULT current_date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    
    -- Garante apenas 1 registro por ticker por dia
    CONSTRAINT scores_diarios_ticker_data_key UNIQUE(ticker, data)
);

-- Tabela de indicados diários (Top 5+ do dia)
CREATE TABLE IF NOT EXISTS public.indicados_diarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker text NOT NULL,
    score integer NOT NULL,
    motivo text,
    data date DEFAULT current_date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Configuração simples de RLS (Para o frontend ler, caso precise)
-- Como o backend usa o SERVICE_KEY para INSERIR,
-- só precisamos permitir leitura (SELECT) pública/autenticada, se for o caso do seu app.

ALTER TABLE public.scores_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicados_diarios ENABLE ROW LEVEL SECURITY;

-- Permitir select anônimo ou auth (dependendo da sua necessidade)
CREATE POLICY "Permitir select para todos em scores_diarios" ON public.scores_diarios
    FOR SELECT USING (true);

CREATE POLICY "Permitir select para todos em indicados_diarios" ON public.indicados_diarios
    FOR SELECT USING (true);
