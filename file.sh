# Criar projeto
npx create-react-app time-clock-system --template typescript
cd time-clock-system

# Instalar dependências
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-label

# Configurar Tailwind
npx tailwindcss init -p

# Rodar
npm start