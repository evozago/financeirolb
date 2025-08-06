-- Add categoria field to fornecedores table
ALTER TABLE fornecedores ADD COLUMN categoria_id uuid REFERENCES categorias_produtos(id);