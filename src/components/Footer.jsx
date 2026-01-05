import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                mt: 'auto',
                backgroundColor: '#1a1a2e',
                borderTop: '1px solid #16213e',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    maxWidth: 'xl',
                    mx: 'auto',
                }}
            >
                {/* Copyright */}
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    © 2024 Shia's Transportation. All rights reserved.
                </Typography>

                {/* Powered By */}
                <Link
                    href="https://www.northbitsolutions.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        '&:hover': {
                            opacity: 0.8,
                        },
                    }}
                >
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Powered by
                    </Typography>
                    <Box
                        component="img"
                        src="https://www.northbitsolutions.com/assets/northbit_horizontal_transparent-DaKtIR1p.png"
                        alt="Northbit Solutions"
                        sx={{
                            height: 48,
                            width: 'auto',
                        }}
                    />
                </Link>
            </Box>
        </Box>
    );
};

export default Footer;
