import {
  profileApi,
  type ProfileCertification,
  type ProfileLanguage,
  type ProfileLink,
  type ProfileProject,
  type SaveCertificationDto,
  type SaveLanguageDto,
  type SaveLinkDto,
  type SaveProjectDto,
  type LanguageProficiency,
} from '../api'
import {
  LANGUAGE_LEVELS,
  formatYear,
  languageLabel,
  yearToDate,
} from '../lib/experience'
import { ListSection } from './list-section'

const orNull = (v?: string) => v?.trim() || null

export function ProjectsSection({
  candidateId,
  items,
}: {
  candidateId: number
  items: ProfileProject[]
}) {
  return (
    <ListSection<ProfileProject, SaveProjectDto>
      title='Projects'
      itemLabel='project'
      emptyText='No projects yet. Add notable projects you want on your CV.'
      candidateId={candidateId}
      items={items}
      fields={[
        { name: 'name', label: 'Project name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        {
          name: 'url',
          label: 'Project URL',
          type: 'text',
          placeholder: 'https://',
        },
      ]}
      render={(p) => (
        <>
          <p className='font-semibold'>{p.name}</p>
          {p.description && (
            <p className='mt-1 whitespace-pre-line'>{p.description}</p>
          )}
          {p.url && (
            <a
              href={p.url}
              target='_blank'
              rel='noreferrer'
              className='text-primary underline'
            >
              {p.url}
            </a>
          )}
        </>
      )}
      toValues={(p) => ({
        name: p.name,
        description: p.description ?? '',
        url: p.url ?? '',
      })}
      toDto={(v, p) => ({
        name: v.name.trim(),
        description: orNull(v.description),
        url: orNull(v.url),
        startDate: p?.startDate ?? null,
        endDate: p?.endDate ?? null,
      })}
      api={{
        add: profileApi.addProject,
        update: profileApi.updateProject,
        remove: profileApi.deleteProject,
      }}
    />
  )
}

export function CertificationsSection({
  candidateId,
  items,
}: {
  candidateId: number
  items: ProfileCertification[]
}) {
  return (
    <ListSection<ProfileCertification, SaveCertificationDto>
      title='Licenses & certifications'
      itemLabel='certification'
      emptyText='No certifications yet.'
      candidateId={candidateId}
      items={items}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'issuer', label: 'Issuing organization', type: 'text' },
        { name: 'issuedYear', label: 'Issue year', type: 'year' },
        { name: 'expiryYear', label: 'Expiration year', type: 'year' },
        {
          name: 'credentialUrl',
          label: 'Credential URL',
          type: 'text',
          placeholder: 'https://',
        },
      ]}
      render={(c) => (
        <>
          <p className='font-semibold'>{c.name}</p>
          {c.issuer && <p>{c.issuer}</p>}
          {c.issuedDate && (
            <p className='text-muted-foreground'>
              Issued {formatYear(c.issuedDate)}
              {c.expiryDate && ` · Expires ${formatYear(c.expiryDate)}`}
            </p>
          )}
        </>
      )}
      toValues={(c) => ({
        name: c.name,
        issuer: c.issuer ?? '',
        issuedYear: formatYear(c.issuedDate),
        expiryYear: formatYear(c.expiryDate),
        credentialUrl: c.credentialUrl ?? '',
      })}
      toDto={(v) => ({
        name: v.name.trim(),
        issuer: orNull(v.issuer),
        issuedDate: yearToDate(v.issuedYear),
        expiryDate: yearToDate(v.expiryYear),
        credentialUrl: orNull(v.credentialUrl),
      })}
      api={{
        add: profileApi.addCertification,
        update: profileApi.updateCertification,
        remove: profileApi.deleteCertification,
      }}
    />
  )
}

export function LanguagesSection({
  candidateId,
  items,
}: {
  candidateId: number
  items: ProfileLanguage[]
}) {
  return (
    <ListSection<ProfileLanguage, SaveLanguageDto>
      title='Languages'
      itemLabel='language'
      emptyText='No languages yet.'
      candidateId={candidateId}
      items={items}
      fields={[
        {
          name: 'name',
          label: 'Language',
          type: 'text',
          required: true,
          placeholder: 'Ex: English',
        },
        {
          name: 'proficiency',
          label: 'Proficiency',
          type: 'select',
          required: true,
          options: LANGUAGE_LEVELS,
        },
      ]}
      render={(l) => (
        <>
          <p className='font-semibold'>{l.name}</p>
          <p className='text-muted-foreground'>
            {languageLabel(l.proficiency)}
          </p>
        </>
      )}
      toValues={(l) => ({ name: l.name, proficiency: l.proficiency })}
      toDto={(v) => ({
        name: v.name.trim(),
        proficiency: v.proficiency as LanguageProficiency,
      })}
      api={{
        add: profileApi.addLanguage,
        update: profileApi.updateLanguage,
        remove: profileApi.deleteLanguage,
      }}
    />
  )
}

export function LinksSection({
  candidateId,
  items,
}: {
  candidateId: number
  items: ProfileLink[]
}) {
  return (
    <ListSection<ProfileLink, SaveLinkDto>
      title='Links'
      itemLabel='link'
      emptyText='No links yet. Add GitHub, LinkedIn or a portfolio.'
      candidateId={candidateId}
      items={items}
      fields={[
        {
          name: 'label',
          label: 'Label',
          type: 'text',
          required: true,
          placeholder: 'Ex: GitHub',
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
          placeholder: 'https://',
        },
      ]}
      render={(l) => (
        <>
          <p className='font-semibold'>{l.label}</p>
          <a
            href={l.url.startsWith('http') ? l.url : `https://${l.url}`}
            target='_blank'
            rel='noreferrer'
            className='break-all text-primary underline'
          >
            {l.url}
          </a>
        </>
      )}
      toValues={(l) => ({ label: l.label, url: l.url })}
      toDto={(v) => ({ label: v.label.trim(), url: v.url.trim() })}
      api={{
        add: profileApi.addLink,
        update: profileApi.updateLink,
        remove: profileApi.deleteLink,
      }}
    />
  )
}
