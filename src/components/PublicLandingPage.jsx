import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    TextField,
    Paper,
    IconButton,
    Fade,
    Slide,
    useTheme,
    useMediaQuery,
    Divider,
    Stack,
} from '@mui/material';
import {
    LocalTaxi,
    Security,
    Schedule,
    Star,
    Phone,
    Email,
    Facebook,
    Twitter,
    Instagram,
    KeyboardArrowDown,
    DirectionsCar,
    Groups,
    CheckCircle,
} from '@mui/icons-material';

const LOGO_URL = '/logo.png';
const BACKGROUND_IMAGE = 'https://bc-user-uploads.brandcrowd.com/public/media-Production/4fe807e2-7cac-496d-8560-54d74a02003f/94f081cc-3392-451c-bae1-62e060221e91_2x';

const PublicLandingPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [contactForm, setContactForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleInputChange = (e) => {
        setContactForm({ ...contactForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const subject = `Contact from ${contactForm.firstName} ${contactForm.lastName}`;
        const body = `Name: ${contactForm.firstName} ${contactForm.lastName}%0D%0AEmail: ${contactForm.email}%0D%0APhone: ${contactForm.phone}%0D%0A%0D%0AMessage:%0D%0A${contactForm.message}`;
        window.location.href = `mailto:contact@shiastransport.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    const features = [
        { icon: <Security sx={{ fontSize: 50 }} />, title: 'Safe & Secure', description: 'Your safety is our top priority with vetted professional drivers' },
        { icon: <Schedule sx={{ fontSize: 50 }} />, title: 'Always On Time', description: 'Punctual service you can count on, every single time' },
        { icon: <Star sx={{ fontSize: 50 }} />, title: 'Premium Comfort', description: 'Travel in style with our well-maintained fleet of vehicles' },
        { icon: <Groups sx={{ fontSize: 50 }} />, title: 'Professional Team', description: 'Experienced drivers dedicated to excellent service' },
    ];

    return (
        <Box sx={{ bgcolor: '#0a0a0a', color: 'white', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box
                id="home"
                sx={{
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${BACKGROUND_IMAGE})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: .9,
                        zIndex: 0,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.85) 50%, rgba(15, 52, 96, 0.9) 100%)',
                        zIndex: 1,
                    },
                }}
            >
                {/* Animated background elements */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        background: `
                            radial-gradient(circle at 20% 80%, #e94560 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #0f3460 0%, transparent 50%)
                        `,
                        zIndex: 2,
                    }}
                />

                {/* Navigation */}
                <Box
                    component="nav"
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: { xs: 2, md: 3 },
                        px: { xs: 2, md: 6 },
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            component="img"
                            src={LOGO_URL}
                            alt="Shia's Transportation"
                            sx={{
                                height: { xs: 50, md: 70 },
                                filter: 'brightness(1.1)',
                            }}
                        />
                    </Box>
                    <Stack direction="row" spacing={{ xs: 1, md: 3 }}>
                        {['Home', 'About', 'Contact'].map((item) => (
                            <Button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase())}
                                sx={{
                                    color: 'white',
                                    fontSize: { xs: '0.875rem', md: '1rem' },
                                    fontWeight: 500,
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                    },
                                }}
                            >
                                {item}
                            </Button>
                        ))}
                    </Stack>
                </Box>

                {/* Hero Content */}
                <Container
                    maxWidth="lg"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 10,
                        py: { xs: 4, md: 0 },
                    }}
                >
                    <Fade in timeout={1000}>
                        <Box>
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
                                    fontWeight: 800,
                                    mb: 3,
                                    background: 'linear-gradient(90deg, #fff 0%, #e94560 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 0 60px rgba(233, 69, 96, 0.3)',
                                }}
                            >
                                LET'S FIND YOU A DRIVER!
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    maxWidth: 700,
                                    mx: 'auto',
                                    mb: 5,
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                    lineHeight: 1.8,
                                }}
                            >
                                Shia's Transportation provides safe, comfortable, and punctual transportation
                                services for long-distance trips and daily commutes. Trust us to get you where
                                you need to go!
                            </Typography>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                justifyContent="center"
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => scrollToSection('contact')}
                                    sx={{
                                        bgcolor: '#e94560',
                                        px: 5,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        borderRadius: 3,
                                        '&:hover': {
                                            bgcolor: '#d63d56',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 30px rgba(233, 69, 96, 0.4)',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                    startIcon={<Phone />}
                                >
                                    Contact Us
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => scrollToSection('about')}
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.5)',
                                        color: 'white',
                                        px: 5,
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        borderRadius: 3,
                                        '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                        },
                                    }}
                                >
                                    Learn More
                                </Button>
                            </Stack>
                        </Box>
                    </Fade>
                </Container>

                {/* Scroll indicator */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 30,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: 'bounce 2s infinite',
                        cursor: 'pointer',
                        '@keyframes bounce': {
                            '0%, 20%, 50%, 80%, 100%': { transform: 'translateX(-50%) translateY(0)' },
                            '40%': { transform: 'translateX(-50%) translateY(-10px)' },
                            '60%': { transform: 'translateX(-50%) translateY(-5px)' },
                        },
                    }}
                    onClick={() => scrollToSection('features')}
                >
                    <KeyboardArrowDown sx={{ fontSize: 40, color: 'rgba(255,255,255,0.6)' }} />
                </Box>
            </Box>

            {/* Features Section */}
            <Box
                id="features"
                sx={{
                    py: { xs: 8, md: 12 },
                    bgcolor: '#111',
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        textAlign="center"
                        sx={{
                            mb: 2,
                            fontWeight: 700,
                            fontSize: { xs: '2rem', md: '3rem' },
                        }}
                    >
                        Why Choose Us?
                    </Typography>
                    <Typography
                        textAlign="center"
                        sx={{ mb: 8, color: 'rgba(255,255,255,0.6)', maxWidth: 600, mx: 'auto' }}
                    >
                        Experience the difference with our commitment to excellence
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                            gap: 4,
                        }}
                    >
                        {features.map((feature, index) => (
                            <Slide key={index} direction="up" in timeout={500 + index * 200}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        borderRadius: 4,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            transform: 'translateY(-5px)',
                                            borderColor: '#e94560',
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                        },
                                    }}
                                >
                                    <Box sx={{ color: '#e94560', mb: 2 }}>{feature.icon}</Box>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'white' }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                        {feature.description}
                                    </Typography>
                                </Paper>
                            </Slide>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* About Section */}
            <Box
                id="about"
                sx={{
                    py: { xs: 8, md: 12 },
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: { xs: 4, md: 8 },
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{ color: '#e94560', fontWeight: 600, letterSpacing: 2 }}
                            >
                                About Us
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    mt: 1,
                                    mb: 3,
                                    fontWeight: 700,
                                    fontSize: { xs: '2rem', md: '2.75rem' },
                                }}
                            >
                                Your Trusted Transportation Partner
                            </Typography>
                            <Typography
                                sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    mb: 3,
                                    lineHeight: 1.8,
                                }}
                            >
                                Founded in 2024, Shia's Transportation is dedicated to providing exceptional
                                transportation services that exceed our customers' expectations. With a focus on
                                safety, comfort, and punctuality, our team of experienced drivers and staff work
                                tirelessly to ensure a seamless travel experience.
                            </Typography>
                            <Typography
                                sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    mb: 4,
                                    lineHeight: 1.8,
                                }}
                            >
                                Our mission is to deliver reliable and efficient transportation solutions for
                                long-distance trips and daily commutes, building trust and loyalty with our
                                customers through our commitment to excellence.
                            </Typography>
                            <Stack spacing={2}>
                                {[
                                    'Professional & vetted drivers',
                                    '24/7 customer support',
                                    'Competitive pricing',
                                    'Wide service coverage',
                                ].map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CheckCircle sx={{ color: '#e94560' }} />
                                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{item}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -20,
                                        left: -20,
                                        right: 20,
                                        bottom: 20,
                                        border: '2px solid #e94560',
                                        borderRadius: 4,
                                        opacity: 0.3,
                                    },
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 6,
                                        bgcolor: 'rgba(233, 69, 96, 0.1)',
                                        borderRadius: 4,
                                        border: '1px solid rgba(233, 69, 96, 0.3)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <DirectionsCar sx={{ fontSize: 120, color: '#e94560', opacity: 0.8 }} />
                                    <Typography
                                        variant="h3"
                                        sx={{ mt: 2, fontWeight: 700, color: 'white' }}
                                    >
                                        100+
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Happy Customers Monthly
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Contact Section */}
            <Box
                id="contact"
                sx={{
                    py: { xs: 8, md: 12 },
                    bgcolor: '#111',
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: { xs: 4, md: 8 },
                        }}
                    >
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{ color: '#e94560', fontWeight: 600, letterSpacing: 2 }}
                            >
                                Get In Touch
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    mt: 1,
                                    mb: 3,
                                    fontWeight: 700,
                                    fontSize: { xs: '2rem', md: '2.75rem' },
                                }}
                            >
                                Contact Us
                            </Typography>
                            <Typography
                                sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    mb: 4,
                                    lineHeight: 1.8,
                                }}
                            >
                                Whether you're traveling for business or pleasure, we're here to take care of
                                your transportation needs with professionalism and care. Reach out to us today!
                            </Typography>
                            <Stack spacing={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(233, 69, 96, 0.1)',
                                        }}
                                    >
                                        <Email sx={{ color: '#e94560' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            Email
                                        </Typography>
                                        <Typography
                                            component="a"
                                            href="mailto:contact@shiastransport.com"
                                            sx={{
                                                color: 'white',
                                                textDecoration: 'none',
                                                '&:hover': { color: '#e94560' },
                                            }}
                                        >
                                            contact@shiastransport.com
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(233, 69, 96, 0.1)',
                                        }}
                                    >
                                        <Phone sx={{ color: '#e94560' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            Phone
                                        </Typography>
                                        <Typography
                                            component="a"
                                            href="tel:929-278-5870"
                                            sx={{
                                                color: 'white',
                                                textDecoration: 'none',
                                                '&:hover': { color: '#e94560' },
                                            }}
                                        >
                                            929.278.5870
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                            <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
                            <Typography sx={{ mb: 2, color: 'rgba(255,255,255,0.6)' }}>
                                Follow us on social media
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                                    <IconButton
                                        key={i}
                                        sx={{
                                            color: 'rgba(255,255,255,0.6)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            '&:hover': {
                                                color: '#e94560',
                                                borderColor: '#e94560',
                                                bgcolor: 'rgba(233, 69, 96, 0.1)',
                                            },
                                        }}
                                    >
                                        <Icon />
                                    </IconButton>
                                ))}
                            </Stack>
                        </Box>
                        <Paper
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                p: 4,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'white' }}>
                                Send us a message
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <TextField
                                    name="firstName"
                                    label="First Name"
                                    required
                                    value={contactForm.firstName}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={textFieldStyles}
                                />
                                <TextField
                                    name="lastName"
                                    label="Last Name"
                                    required
                                    value={contactForm.lastName}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <TextField
                                name="email"
                                label="Email Address"
                                type="email"
                                required
                                fullWidth
                                value={contactForm.email}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ ...textFieldStyles, mb: 2 }}
                            />
                            <TextField
                                name="phone"
                                label="Phone Number"
                                required
                                fullWidth
                                value={contactForm.phone}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ ...textFieldStyles, mb: 2 }}
                            />
                            <TextField
                                name="message"
                                label="Message"
                                required
                                fullWidth
                                multiline
                                rows={4}
                                value={contactForm.message}
                                onChange={handleInputChange}
                                variant="outlined"
                                sx={{ ...textFieldStyles, mb: 3 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    bgcolor: '#e94560',
                                    py: 1.5,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    '&:hover': {
                                        bgcolor: '#d63d56',
                                    },
                                }}
                            >
                                Send Message
                            </Button>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 3,
                    px: 3,
                    bgcolor: '#0a0a0a',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            © 2024 Shia's Transportation. All Rights Reserved.
                        </Typography>
                        <Box
                            component="a"
                            href="https://www.northbitsolutions.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                textDecoration: 'none',
                                '&:hover': { opacity: 0.8 },
                            }}
                        >
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Powered by
                            </Typography>
                            <Box
                                component="img"
                                src="https://www.northbitsolutions.com/assets/northbit_horizontal_transparent-DaKtIR1p.png"
                                alt="Northbit Solutions"
                                sx={{ height: 40 }}
                            />
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
        color: 'white',
        '& fieldset': {
            borderColor: 'rgba(255,255,255,0.2)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255,255,255,0.4)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#e94560',
        },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255,255,255,0.6)',
        '&.Mui-focused': {
            color: '#e94560',
        },
    },
};

export default PublicLandingPage;
