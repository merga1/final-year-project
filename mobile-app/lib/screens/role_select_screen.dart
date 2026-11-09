import 'package:flutter/material.dart';

import '../widgets/aquasense_logo.dart';

/// Entry screen for the shared customer/technician app.
///
/// The customer and technician accounts live in the same backend, so the app
/// asks which portal the user wants before showing the login form.
class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key, required this.onSelectRole});

  /// Called with `customer` or `technician`.
  final ValueChanged<String> onSelectRole;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(
                child: AquaSenseLogo(
                  iconSize: 68,
                  horizontal: false,
                  showSubtitle: true,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Welcome to AquaSense',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Choose how you want to continue.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),
              _RoleCard(
                icon: Icons.person_outline_rounded,
                title: 'Customer',
                subtitle:
                    'Check your water usage, pay bills and request a water meter.',
                accent: const Color(0xFF0284C7),
                onTap: () => onSelectRole('customer'),
              ),
              const SizedBox(height: 14),
              _RoleCard(
                icon: Icons.engineering_outlined,
                title: 'Technician',
                subtitle:
                    'View the jobs assigned to you and update your field work.',
                accent: const Color(0xFF1E6B52),
                onTap: () => onSelectRole('technician'),
              ),
              const SizedBox(height: 28),
              Text(
                'Technician accounts are created by the administrator.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
              ),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  '© 2025 AquaSense. All rights reserved.',
                  style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: accent, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Color(0xFF64748B),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: accent),
          ],
        ),
      ),
    );
  }
}
