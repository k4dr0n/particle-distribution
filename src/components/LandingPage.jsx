import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const LandingPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4, color: '#87ADDD' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <img 
          src="/images/logo.png" 
          alt="Ombros de Gigantes"
          style={{ 
            maxWidth: '100%',
            height: 'auto',
            marginBottom: '2rem'
          }}
        />
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            color: '#87ADDD',
            mb: 2,
            fontWeight: 'bold'
          }}
        >
          Bem-vindo ao Ombros de Gigantes
        </Typography>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#87ADDD',
            mb: 4
          }}
        >
          Ciências Exatas sem Burocracia
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography paragraph sx={{ fontSize: '1.1rem', mb: 3 }}>
          Aqui, você encontra uma metodologia de ensino única, desenvolvida por um Doutor em Física com mais de 20 anos de experiência em aulas de reforço e preparação para concursos. Sabemos que o ensino tradicional nem sempre atende às suas necessidades. Por isso, criamos uma abordagem que começa onde você está, identificando suas dificuldades e construindo uma base sólida para o aprendizado.
        </Typography>
        
        <Typography paragraph sx={{ fontSize: '1.1rem', mb: 3 }}>
          No Ombros de Gigantes, acreditamos que todos têm potencial para dominar matemática, física e outras áreas das ciências exatas, desde que sejam guiados com clareza, empatia e uma metodologia comprovada.
        </Typography>
        
        <Typography paragraph sx={{ fontSize: '1.1rem', mb: 3 }}>
          Inspirados pela frase de Isaac Newton, "Se enxerguei mais longe, foi por estar sobre ombros de gigantes", nossa missão é ajudar você a alcançar novos horizontes no conhecimento, superando obstáculos e se preparando para os desafios do futuro.
        </Typography>
      </Box>

      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#87ADDD',
            mb: 3,
            fontWeight: 'bold'
          }}
        >
          O que oferecemos?
        </Typography>
        <ul style={{ color: '#87ADDD', fontSize: '1.1rem' }}>
          <li>Ensino personalizado e direto ao ponto.</li>
          <li>Cursos online disponíveis 24/7, no seu ritmo.</li>
          <li>Conteúdo que vai direto ao que você precisa aprender, sem enrolação.</li>
        </ul>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#87ADDD',
            mb: 2
          }}
        >
          Comece hoje mesmo a enxergar mais longe.
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#87ADDD'
          }}
        >
          Junte-se a nós e transforme sua relação com as ciências exatas.
        </Typography>
      </Box>
    </Container>
  );
};

export default LandingPage;
